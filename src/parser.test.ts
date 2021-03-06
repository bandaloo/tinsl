import { expect } from "chai";
import { parse, parseAndCheck } from "./gen";
import {
  Assign,
  BinaryExpr,
  BoolExpr,
  CallExpr,
  ColorString,
  ConstructorExpr,
  Else,
  Expr,
  ExSt,
  FloatExpr,
  ForLoop,
  Frag,
  FuncDef,
  IdentExpr,
  If,
  IntExpr,
  Param,
  ProcCall,
  ProcDef,
  Refresh,
  RenderBlock,
  Return,
  SubscriptExpr,
  TernaryExpr,
  TopDef,
  TypeName,
  UIntExpr,
  UnaryExpr,
  Uniform,
  VarDecl,
} from "./nodes";
import { checkExpr, checkProgram, tok } from "./test.helpers";

const oneTwoThreeForward = (op1: string, op2: string) =>
  new BinaryExpr(
    new BinaryExpr(new IntExpr(tok("1")), tok(op1), new IntExpr(tok("2"))),
    tok(op2),
    new IntExpr(tok("3"))
  );

const oneTwoThreeBackward = (op1: string, op2: string) =>
  new BinaryExpr(
    new IntExpr(tok("1")),
    tok(op1),
    new BinaryExpr(new IntExpr(tok("2")), tok(op2), new IntExpr(tok("3")))
  );

const logicReverse = new BinaryExpr(
  new BoolExpr(tok("true")),
  tok("||"),
  new BinaryExpr(
    new BoolExpr(tok("false")),
    tok("^^"),
    new BinaryExpr(
      new BoolExpr(tok("true")),
      tok("&&"),
      new BoolExpr(tok("false"))
    )
  )
);

const bitwiseReverse = new BinaryExpr(
  new UIntExpr(tok("1u")),
  tok("|"),
  new BinaryExpr(
    new UIntExpr(tok("2u")),
    tok("^"),
    new BinaryExpr(new UIntExpr(tok("3u")), tok("&"), new UIntExpr(tok("4u")))
  )
);

const oneCompareTwo = (comp: string, eq: string) =>
  new BinaryExpr(
    new BinaryExpr(new IntExpr(tok("1")), tok(comp), new IntExpr(tok("2"))),
    tok(eq),
    new BoolExpr(tok("true"))
  );

const oneTwoThreeBitshift = new BinaryExpr(
  new BinaryExpr(new IntExpr(tok("1")), tok("<<"), new IntExpr(tok("2"))),
  tok(">>"),
  new IntExpr(tok("3"))
);

const oneTwoThreeForwardUnary = new BinaryExpr(
  new BinaryExpr(
    new UnaryExpr(tok("+"), new IntExpr(tok("1"))),
    tok("<"),
    new BinaryExpr(
      new UnaryExpr(tok("-"), new IntExpr(tok("2"))),
      tok("+"),
      new UnaryExpr(tok("~"), new IntExpr(tok("3")))
    )
  ),
  tok("=="),
  new BinaryExpr(
    new UnaryExpr(tok("!"), new IntExpr(tok("true"))),
    tok("||"),
    new UnaryExpr(tok("!"), new IntExpr(tok("false")))
  )
);

const vec = (...args: number[]) =>
  new ConstructorExpr(
    tok("("),
    new TypeName(tok("vec" + args.length)),
    args.map((n) => new FloatExpr(tok(n + ".")))
  );

const mat = (redundant: boolean, ...args: number[][]) =>
  new ConstructorExpr(
    tok("("),
    new TypeName(
      tok(
        "mat" +
          (!redundant && args.length === args[0].length
            ? args.length
            : args[0].length + "x" + args.length)
      )
    ),
    args.flat().map((n) => new FloatExpr(tok(n + ".")))
  );

const assignFloat = (left: string, symbol: string, right: string) =>
  new Assign(new IdentExpr(tok(left)), tok(symbol), new FloatExpr(tok(right)));

const funcNoParams = new FuncDef(
  new TypeName(tok("float")),
  tok("foo"),
  [],
  [
    new UnaryExpr(tok("+"), new FloatExpr(tok("1."))),
    new UnaryExpr(tok("-"), new FloatExpr(tok("2."))),
    new Return(new FloatExpr(tok("1.")), tok("return")),
  ]
);

const tern = (cond: string, first: string, second: string) =>
  new TernaryExpr(
    new BoolExpr(tok(cond)),
    new IntExpr(tok(first)),
    new IntExpr(tok(second)),
    tok("?")
  );

describe("order of ops", () => {
  it("parses in reverse precedence logical or, xor, and", () => {
    checkExpr("true || false ^^ true && false", logicReverse);
  });

  it("parses in reverse precedence bitwise or, xor, and", () => {
    checkExpr("1u | 2u ^ 3u & 4u", bitwiseReverse);
  });

  it("parses relational and equality", () => {
    checkExpr("1 < 2 == true", oneCompareTwo("<", "=="));
    checkExpr("1 > 2 == true", oneCompareTwo(">", "=="));
    checkExpr("1 <= 2 != true", oneCompareTwo("<=", "!="));
    checkExpr("1 >= 2 != true", oneCompareTwo(">=", "!="));
  });

  it("parses bitshift", () => {
    checkExpr("1 << 2 >> 3", oneTwoThreeBitshift);
  });

  it("parses arithmetic order of ops", () => {
    checkExpr("1 + 2 - 3", oneTwoThreeForward("+", "-"));
    checkExpr("1 * 2 / 3", oneTwoThreeForward("*", "/"));
    checkExpr("1 * 2 % 3", oneTwoThreeForward("*", "%"));
    checkExpr("1 + 2 * 3", oneTwoThreeBackward("+", "*"));
    checkExpr("1 - 2 / 3", oneTwoThreeBackward("-", "/"));
    checkExpr("1 - 2 % 3", oneTwoThreeBackward("-", "%"));
  });

  it("parses arithmetic order of ops reversed with parens", () => {
    checkExpr("(1 + 2) * 3", oneTwoThreeForward("+", "*"));
    checkExpr("(1 - 2) / 3", oneTwoThreeForward("-", "/"));
    checkExpr("(1 - 2) % 3", oneTwoThreeForward("-", "%"));
  });

  it("parses prefix unary expressions", () => {
    checkExpr("(+1 < -2 + ~3) == (!true || !false)", oneTwoThreeForwardUnary);
  });

  it("parses ternary expressions with other ops", () => {
    checkExpr("true ? 1 : 2", tern("true", "1", "2"));

    checkExpr(
      "true || false ? 1 + 2 : 3 / 4",
      new TernaryExpr(
        new BinaryExpr(
          new BoolExpr(tok("true")),
          tok("||"),
          new BoolExpr(tok("false"))
        ),
        new BinaryExpr(new IntExpr(tok("1")), tok("+"), new BoolExpr(tok("2"))),
        new BinaryExpr(new IntExpr(tok("3")), tok("/"), new BoolExpr(tok("4"))),
        tok("?")
      )
    );
  });

  it("parses nested ternary expressions testing right associativity", () => {
    checkExpr(
      "true ? true ? 1 : 2 : 3",
      new TernaryExpr(
        new BoolExpr(tok("true")),
        tern("true", "1", "2"),
        new IntExpr(tok("3")),
        tok("?")
      )
    );

    const ternaryAssociative = new TernaryExpr(
      new BoolExpr(tok("true")),
      tern("true", "1", "2"),
      tern("false", "3", "4"),
      tok("?")
    );

    checkExpr("true ? true ? 1 : 2 : false ? 3 : 4", ternaryAssociative);
    checkExpr("true ? (true ? 1 : 2) : false ? 3 : 4", ternaryAssociative);
  });
});

describe("call expressions", () => {
  it("parses vec2 constructor call", () => {
    checkExpr("vec2(0., 1.)", vec(0, 1));
  });

  it("parses vec3 constructor call", () => {
    checkExpr("vec3(0., 1., 2.)", vec(0, 1, 2));
  });

  it("parses vec4 constructor call", () => {
    checkExpr("vec4(0., 1., 2., 3.)", vec(0, 1, 2, 3));
  });

  it("parses mat2 constructor call", () => {
    checkExpr("mat2(0., 1., 2., 3.)", mat(false, [0, 1], [2, 3]));
  });

  it("parses mat3 constructor call", () => {
    checkExpr(
      "mat3(0., 1., 2., 3., 4., 5., 6., 7., 8.)",
      mat(false, [0, 1, 2], [3, 4, 5], [6, 7, 8])
    );
  });

  it("parses mat4 constructor call", () => {
    checkExpr(
      "mat4(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12., 13., 14., 15.)",
      mat(false, [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15])
    );
  });

  it("parses mat2x2 constructor call", () => {
    checkExpr("mat2x2(0., 1., 2., 3.)", mat(true, [0, 1], [2, 3]));
  });

  it("parses mat2x3 constructor call", () => {
    checkExpr(
      "mat2x3(0., 1., 2., 3., 4., 5.)",
      mat(true, [0, 1], [2, 3], [4, 5])
    );
  });

  it("parses mat2x4 constructor call", () => {
    checkExpr(
      "mat2x4(0., 1., 2., 3., 4., 5., 6., 7.)",
      mat(true, [0, 1], [2, 3], [4, 5], [6, 7])
    );
  });

  it("parses mat3x2 constructor call", () => {
    checkExpr(
      "mat3x2(0., 1., 2., 3., 4., 5.)",
      mat(true, [0, 1, 2], [3, 4, 5])
    );
  });

  it("parses mat3x3 constructor call", () => {
    checkExpr(
      "mat3x3(0., 1., 2., 3., 4., 5., 6., 7., 8.)",
      mat(true, [0, 1, 2], [3, 4, 5], [6, 7, 8])
    );
  });

  it("parses mat3x4 constructor call", () => {
    checkExpr(
      "mat3x4(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.)",
      mat(true, [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11])
    );
  });

  it("parses mat4x2 constructor call", () => {
    checkExpr(
      "mat4x2(0., 1., 2., 3., 4., 5., 6., 7.)",
      mat(true, [0, 1, 2, 3], [4, 5, 6, 7])
    );
  });

  it("parses mat4x3 constructor call", () => {
    checkExpr(
      "mat4x3(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.)",
      mat(true, [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11])
    );
  });

  it("parses mat4x4 constructor call", () => {
    checkExpr(
      "mat4x4(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12., 13., 14., 15.)",
      mat(true, [0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15])
    );
  });
});

describe("variable declarations", () => {
  const vec2Decl = new VarDecl(
    "const",
    new TypeName(tok("vec2")),
    tok("bar"),
    vec(1, 2),
    tok("=")
  );

  const arr = [
    new IntExpr(tok("1")),
    new IntExpr(tok("2")),
    new IntExpr(tok("3")),
  ];

  const intArrayDecl = new VarDecl(
    "mut",
    new TypeName(tok("int"), 0),
    tok("arr"),
    new ConstructorExpr(tok("("), new TypeName(tok("int"), 0), arr),
    tok("=")
  );

  it("parses non-constant variable declaration float", () => {
    checkExpr(
      "float foo = 1.",
      new VarDecl(
        "mut",
        new TypeName(tok("float")),
        tok("foo"),
        new FloatExpr(tok("1.")),
        tok("=")
      )
    );
  });

  it("parses constant variable declaration vec2", () => {
    checkExpr("const vec2 bar = vec2(1., 2.)", vec2Decl);
  });

  it("parses declaration with minimal whitespace", () => {
    checkExpr("const vec2 bar=vec2(1.,2.)", vec2Decl);
  });

  it("parses declaration with newlines", () => {
    checkExpr("\nconst\nvec2\nbar\n=\nvec2(1.,2.)\n", vec2Decl);
  });

  it("parses array declaration", () => {
    checkExpr("int[] arr = int[](1, 2, 3)", intArrayDecl);
  });
});

describe("assignment", () => {
  it("parses direct assignment", () => {
    checkExpr("foo = 1.", assignFloat("foo", "=", "1."));
  });

  // TODO assignment not allowed in block (change from checkExpr)
  it("parses all relative assignment float", () => {
    checkExpr("foo += 1.", assignFloat("foo", "+=", "1."));
    checkExpr("foo -= 1.", assignFloat("foo", "-=", "1."));
    checkExpr("foo *= 1.", assignFloat("foo", "*=", "1."));
    checkExpr("foo /= 1.", assignFloat("foo", "/=", "1."));
    checkExpr("foo %= 1.", assignFloat("foo", "%=", "1."));
    checkExpr("foo &= 1.", assignFloat("foo", "&=", "1."));
    checkExpr("foo ^= 1.", assignFloat("foo", "^=", "1."));
    checkExpr("foo |= 1.", assignFloat("foo", "|=", "1."));
    checkExpr("foo <<= 1.", assignFloat("foo", "<<=", "1."));
    checkExpr("foo >>= 1.", assignFloat("foo", ">>=", "1."));
  });

  it("parses assignment vec2", () => {
    checkExpr(
      "foo.xy = vec2(1., 2.)",
      new Assign(
        new BinaryExpr(
          new IdentExpr(tok("foo")),
          tok("."),
          new IdentExpr(tok("xy"))
        ),
        tok("="),
        vec(1, 2)
      )
    );
  });
});

describe("function and procedure declarations", () => {
  const noDefaultParams = [
    new Param(new TypeName(tok("vec2")), tok("bar")),
    new Param(new TypeName(tok("vec3")), tok("baz")),
  ];

  const defaultParams = [
    new Param(new TypeName(tok("float")), tok("bar"), new FloatExpr(tok(".1"))),
    new Param(new TypeName(tok("float")), tok("baz"), new FloatExpr(tok(".2"))),
  ];

  it("parses function declaration two arguments no defaults", () => {
    checkProgram("float foo (vec2 bar, vec3 baz) { return 1.; }", [
      new FuncDef(new TypeName(tok("float")), tok("foo"), noDefaultParams, [
        new Return(new FloatExpr(tok("1.")), tok("return")),
      ]),
    ]);
  });

  it("parses function declaration two arguments defaults", () => {
    checkProgram("float foo (float bar = .1, float baz = .2) { return 1.; }", [
      new FuncDef(new TypeName(tok("float")), tok("foo"), defaultParams, [
        new Return(new FloatExpr(tok("1.")), tok("return")),
      ]),
    ]);
  });

  it("parses function declaration no args multiple statements", () => {
    checkProgram(
      `float foo () {
  +1.;
  -2.;
  return 1.;
}`,
      [funcNoParams]
    );
  });

  it("parses function declaration no args with spaces in parens", () => {
    checkProgram(
      `float foo (       ) {
  +1.;
  -2.;
  return 1.;
}`,
      [funcNoParams]
    );
  });

  it("parses function redundant semicolons after", () => {
    checkProgram(
      `float foo () {
  +1.;;
  -2.;;;
  return 1.;;;
  ;
}`,
      [funcNoParams]
    );
  });

  it("parses function redundant semicolons before", () => {
    checkProgram(
      `float foo () {
  ;
  ;+1.;;
  -2.;;;
  return 1.;
}`,
      [funcNoParams]
    );
  });

  it("parses two function declarations", () => {
    checkProgram(
      `float foo () {
  +1.;
  -2.;
  return 1.;
}
float foo () {
  +1.;
  -2.;
  return 1.;
}`,
      [funcNoParams, funcNoParams]
    );
  });

  it("parses two function declarations surrounding whitespace", () => {
    checkProgram(
      `\n\n\nfloat foo () {
  +1.;
  -2.;
  return 1.;
}
float foo () {
  +1.;
  -2.;
  return 1.;
}\n\n\n`,
      [funcNoParams, funcNoParams]
    );
  });

  it("parses function declaration return type array", () => {
    checkProgram(
      `
int[2] foo () {
  return int[](1, 2);
}`,
      [
        new FuncDef(
          new TypeName(tok("int"), 2),
          tok("foo"),
          [],
          [
            new Return(
              new ConstructorExpr(tok("("), new TypeName(tok("int"), 0), [
                new IntExpr(tok("1")),
                new IntExpr(tok("2")),
              ]),
              tok("return")
            ),
          ]
        ),
      ]
    );
  });

  const procDecl = (args: Param[]) =>
    new ProcDef(tok("foo"), args, [vec(1, 0, 0, 1)]);

  it("parses proc decl no arguments", () => {
    checkProgram("pr foo() {vec4(1., 0., 0., 1.);}", [procDecl([])]);
  });

  it("parses proc decl two arguments no default", () => {
    checkProgram("pr foo(vec2 bar, vec3 baz) {vec4(1., 0., 0., 1.);}", [
      procDecl(noDefaultParams),
    ]);
  });

  it("parses proc decl two arguments default params", () => {
    checkProgram(
      "pr foo(float bar = .1, float baz = .2) {vec4(1., 0., 0., 1.);}",
      [procDecl(defaultParams)]
    );
  });

  it("parses procedure excessive whitespace", () => {
    checkProgram(
      "\npr\nfoo\n(\nfloat\nbar\n=\n.1,\nfloat\nbaz\n=\n.2)\n{\nvec4(1., 0., 0., 1.);\n}\n",
      [procDecl(defaultParams)]
    );
  });
});

describe("render block", () => {
  const empty = new RenderBlock(
    false,
    [vec(1, 2, 3, 4)],
    null,
    null,
    null,
    tok("{")
  );
  const bl = new RenderBlock(false, [vec(1, 2, 3, 4)], null, 0, null, tok("{"));
  const nestedBl = new RenderBlock(
    false,
    [vec(1, 2, 3, 4), bl, vec(5, 6, 7, 8)],
    null,
    0,
    null,
    tok("{")
  );
  const refreshBl = new RenderBlock(
    false,
    [vec(1, 2, 3, 4), new Refresh(tok("refresh"))],
    null,
    0,
    null,
    tok("{")
  );

  const completeBlock = (
    inNum: number | Expr = 0,
    outNum: number | Expr = 1,
    loopNum: number | Expr = 2
  ) =>
    new RenderBlock(
      true,
      [vec(1, 2, 3, 4), vec(5, 6, 7, 8)],
      inNum,
      outNum,
      loopNum,
      tok("{")
    );

  it("parses an empty render block", () => {
    checkProgram("{vec4(1., 2., 3., 4.);}", [empty]);
  });

  it("parses a render block only out number minimal ws", () => {
    checkProgram("{vec4(1., 2., 3., 4.);}->0", [bl]);
  });

  it("parses render block surrounding whitespace", () => {
    checkProgram(" \n\t{vec4(1., 2., 3., 4.);}->0 \n\t", [bl]);
  });

  it("parses a render block with all options and multiple statements", () => {
    checkProgram(
      `0 -> loop 2 once {
  vec4(1., 2., 3., 4.);
  vec4(5., 6., 7., 8.);
} -> 1`,
      [completeBlock()]
    );
  });

  it("parses complete render block where all numbers are identifiers", () => {
    checkProgram(
      `inNum -> loop loopNum once {
  vec4(1., 2., 3., 4.);
  vec4(5., 6., 7., 8.);
} -> outNum`,
      [
        completeBlock(
          new IdentExpr(tok("inNum")),
          new IdentExpr(tok("outNum")),
          new IdentExpr(tok("loopNum"))
        ),
      ]
    );
  });

  it("parses render block with redundant semicolons", () => {
    checkProgram(
      `0 -> loop 2 once {
  ;
  vec4(1., 2., 3., 4.);;
  vec4(5., 6., 7., 8.);;
  ;
} -> 1`,
      [completeBlock()]
    );
  });

  it("parses a render block with all options minimal ws", () => {
    checkProgram(
      `0->loop 2once{vec4(1., 2., 3., 4.);vec4(5., 6., 7., 8.);}->1`,
      [completeBlock()]
    );
  });

  it("parses two render blocks", () => {
    checkProgram("{vec4(1., 2., 3., 4.);}->0\n{vec4(1., 2., 3., 4.);}->0", [
      bl,
      bl,
    ]);
  });

  it("parses nested render blocks", () => {
    checkProgram(
      `
{
  vec4(1., 2., 3., 4.);
  {
    vec4(1., 2., 3., 4.);
  } -> 0
  vec4(5., 6., 7., 8.);
} -> 0`,
      [nestedBl]
    );
  });

  it("parses refresh in a renderblock", () => {
    checkProgram(`{vec4(1., 2., 3., 4.); refresh;}->0`, [refreshBl]);
  });

  it("parses function decl and renderblock", () => {
    checkProgram(
      `float foo () {
  +1.;
  -2.;
  return 1.;
}
{vec4(1., 2., 3., 4.);}->0`,
      [funcNoParams, bl]
    );
  });
});

describe("top level definitions", () => {
  const topLevel = (scalar: number) =>
    new TopDef(
      tok("pi" + scalar),
      new BinaryExpr(
        new FloatExpr(tok("3.14159")),
        tok("*"),
        new FloatExpr(tok(scalar + "."))
      )
    );

  it("parses a top level definition", () => {
    checkProgram("def pi2 3.14159 * 2.", [topLevel(2)]);
  });

  it("parses a top level definition", () => {
    checkProgram("def pi2 3.14159 * 2.\ndef pi3 3.14159 * 3.", [
      topLevel(2),
      topLevel(3),
    ]);
  });

  it("parses a top level definition", () => {
    checkProgram("def\npi2\n3.14159\n*\n2.\ndef\npi3\n3.14159\n*\n3.", [
      topLevel(2),
      topLevel(3),
    ]);
  });
});

describe("for loops", () => {
  const emptyForLoop = new ForLoop(null, null, null, [], tok("for"));

  const forLoop = (body: ExSt[]) =>
    new ForLoop(
      new VarDecl(
        "mut",
        new TypeName(tok("int")),
        tok("i"),
        new IntExpr(tok("0")),
        tok("=")
      ),
      new BinaryExpr(new IdentExpr(tok("i")), tok("<"), new IntExpr(tok("3"))),
      new UnaryExpr(tok("++"), new IdentExpr(tok("i")), true),
      body,
      tok("for")
    );

  const jUnary = new UnaryExpr(tok("++"), new IdentExpr(tok("j")), true);
  const kUnary = new UnaryExpr(tok("++"), new IdentExpr(tok("k")), true);

  const fullForLoop1 = forLoop([jUnary]);
  const fullForLoop2 = forLoop([jUnary, kUnary]);

  it("parses an empty for loop with empty body brackets", () => {
    checkExpr("for(;;){}", emptyForLoop, false);
  });

  it("parses full for loop minimal whitespace", () => {
    checkExpr("for(int i=0;i<3;i++){j++;k++;}", fullForLoop2, false);
  });

  it("parses full for loop natural whitespace", () => {
    checkExpr(
      `for (int i = 0; i < 3; i++) {
  j++;
  k++;
}`,
      fullForLoop2,
      false
    );
  });

  it("parses full for loop excessive whitespace", () => {
    checkExpr(
      `
for
(
  int i = 0;
  i < 3;
  i++
)
{
  j++;
  k++;
}
`,
      fullForLoop2,
      false
    );
  });

  it("parses for loop no brackets various spacing", () => {
    checkExpr(`for(int i = 0;i < 3;i++)j++;`, fullForLoop1, false);
    checkExpr(
      `for(int i = 0; i < 3; i++)
  j++;`,
      fullForLoop1,
      false
    );
  });

  it("parses for loop with redundant semicolons", () => {
    checkExpr(`for(int i=0;i<3;i++)j++;;;;`, fullForLoop1, false);
    checkExpr(`for(int i=0;i<3;i++){;;j++;;;;}`, fullForLoop1, false);
    checkExpr(`for(int i=0;i<3;i++){;;j++;;k++;;}`, fullForLoop2, false);
  });

  const declHelper = (str: string) =>
    new VarDecl(
      "mut",
      new TypeName(tok("int")),
      tok(str),
      new IntExpr(tok("0")),
      tok("=")
    );

  const forFunc = new FuncDef(
    new TypeName(tok("float")),
    tok("foo"),
    [],
    [
      declHelper("j"),
      declHelper("k"),
      fullForLoop1,
      fullForLoop2,
      new Return(new IdentExpr(tok("k")), tok("return")),
    ]
  );

  it("parses multiple for loops", () => {
    checkProgram(
      `
float foo () {
  int j = 0;
  int k = 0;

  for(int i = 0; i < 3; i++)
    j++;

  for(int i = 0; i < 3; i++) {
    j++;
    k++;
  }

  return k;
}
    `,
      [forFunc]
    );
  });

  it("cannot parse when condition expression is declaration", () => {
    expect(() =>
      parse("float foo () {for(int i = 0; int k = 0; i++) {}}")
    ).to.throw("unexpected");
  });

  it("cannot parse when condition expression is assignment", () => {
    expect(() =>
      parse("float foo () {for(int i = 0; k = 0; i++) {}}")
    ).to.throw("unexpected");
  });

  it("cannot parse when final expression is declaration", () => {
    expect(() =>
      parse("float foo () {for(int i = 0; i < 3; int k = 1) {}}")
    ).to.throw("unexpected");
  });
});

describe("ifs and elses", () => {
  const basicIf = (cont: Else | null) =>
    new If(
      new BoolExpr(tok("true")),
      [new Return(new BoolExpr(tok("false")), tok("return"))],
      tok("if"),
      cont
    );

  const basicElse = new Else(
    [new Return(new BoolExpr(tok("true")), tok("return"))],
    tok("else")
  );

  const basicElseIf = new Else([basicIf(null)], tok("else"));

  const basicElseIfElse = new Else([basicIf(basicElse)], tok("else"));

  it("parses basic if statement", () => {
    checkExpr("if(true)return false;", basicIf(null));
  });

  it("parses basic if else statement", () => {
    checkExpr("if(true)return false;else return true;", basicIf(basicElse));
  });

  it("parses basic if else if statement", () => {
    checkExpr(
      "if(true)return false;else if(true)return false;",
      basicIf(basicElseIf)
    );
  });

  it("parses dangling else", () => {
    checkExpr(
      "if(true)return false;else if(true)return false;else return true;",
      basicIf(basicElseIfElse)
    );
  });

  it("parses basic if statement curly braces", () => {
    checkExpr("if(true){return false;}", basicIf(null));
  });

  it("parses basic if else statement curly braces", () => {
    checkExpr("if(true){return false;}else{return true;}", basicIf(basicElse));
  });

  it("parses basic if else if statement curly braces", () => {
    checkExpr(
      "if(true){return false;}else if(true){return false;}",
      basicIf(basicElseIf)
    );
  });

  it("parses dangling else curly braces", () => {
    checkExpr(
      "if(true){return false;}else if(true){return false;}else{return true;}",
      basicIf(basicElseIfElse)
    );
  });

  it("parses multiple statements in if and else blocks", () => {
    const assignHelper = (str: string, val: number) =>
      new Assign(
        new IdentExpr(tok(str)),
        tok("="),
        new FloatExpr(tok(val + "."))
      );

    const multiIfElse = new If(
      new BoolExpr(tok("true")),
      [assignHelper("a", 1), assignHelper("b", 2)],
      tok("if"),
      new Else([assignHelper("a", 3), assignHelper("b", 4)], tok("else"))
    );
    checkExpr(
      `
if (true) {
  a = 1.;
  b = 2.;
} else {
  a = 3.;
  b = 4.;
}
    `,
      multiIfElse
    );
  });

  const multiIfElseFunc = new FuncDef(
    new TypeName(tok("float")),
    tok("foo"),
    [],
    [
      basicIf(basicElse),
      basicIf(basicElse),
      new Return(new FloatExpr(tok("1.")), tok("return")),
    ]
  );

  it("parses multiple if else statements", () => {
    checkProgram(
      `
float foo () {
  if (true)
    return false;
  else
    return true;

  if (true)
    return false;
  else
    return true;
  
  return 1.;
}
`,
      [multiIfElseFunc]
    );
  });
});

describe("uniforms", () => {
  const un = (type: string, tokn: string) =>
    new Uniform(new TypeName(tok(type)), tok(tokn));

  it("parses a basic uniform", () => {
    checkProgram("uniform float foo;", [un("float", "foo")]);
  });

  it("parses multiple uniforms", () => {
    checkProgram("uniform float foo;\n\nuniform vec3 bar;", [
      un("float", "foo"),
      un("vec3", "bar"),
    ]);
  });

  it("parses uniform with extra whitespace", () => {
    checkProgram(
      `uniform
    float
    foo
    ;`,
      [un("float", "foo")]
    );
  });
});

describe("function calls and subscripting", () => {
  const fooCall = (args: Expr[]) =>
    new CallExpr(tok("("), new IdentExpr(tok("foo")), args);

  const barSubscript = new SubscriptExpr(
    tok("["),
    new IdentExpr(tok("bar")),
    new IntExpr(tok("3"))
  );

  it("parses function call no args", () => {
    checkExpr("foo()", fooCall([]));
  });

  it("parses function call one arg", () => {
    checkExpr("foo(1)", fooCall([new IntExpr(tok("1"))]));
  });

  it("parses function call multiple args", () => {
    checkExpr(
      "foo(1, 2, 3.4)",
      fooCall([
        new IntExpr(tok("1")),
        new IntExpr(tok("2")),
        new FloatExpr(tok("3.4")),
      ])
    );
  });

  it("parses subscripting an array", () => {
    checkExpr("bar[3]", barSubscript);
  });
});

describe("index out of range tests", () => {
  it("checks index for arrays", () => {
    expect(() =>
      parseAndCheck(`
fn foo() { return int[](1, 2, 3)[3]; }`)
    ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return int[](1, 2, 3)[-1]; }`)
      ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return int[](1, 2, 3)[0]; }`)
      ).to.not.throw();
  });

  it("checks index for vecs", () => {
    expect(() =>
      parseAndCheck(`
fn foo() { return ivec3(1, 2, 3)[3]; }`)
    ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return ivec3(1, 2, 3)[-1]; }`)
      ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return ivec3(1, 2, 3)[0]; }`)
      ).to.not.throw();
  });

  it("checks index for matrices", () => {
    expect(() =>
      parseAndCheck(`
fn foo() { return mat3x4(1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12.)[3]; }`)
    ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return mat3x4(1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12.)[-1]; }`)
      ).to.throw("index");
    () =>
      expect(
        parseAndCheck(`
fn foo() { return mat3x4(1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11., 12.)[0]; }`)
      ).to.not.throw();
  });
});

describe("frag", () => {
  it("parses a frag expression with no sampler number", () => {
    const f = new Frag(tok("frag"));
    expect(f.sampler).to.equal(null);
    checkExpr("frag", f);
  });

  it("parses a frag expression with sampler number, no coords", () => {
    const f = new Frag(tok("frag0"));
    expect(f.sampler).to.equal(0);
    checkExpr("frag0", f);
  });

  it("parses a frag expression with multi-digit sampler number", () => {
    const f = new Frag(tok("frag10"));
    expect(f.sampler).to.equal(10);
    checkExpr("frag10", new Frag(tok("frag10")));
  });

  describe("pure int mixed usage test", () => {
    it("throws when param used for tex num then normally", () => {
      expect(() =>
        parseAndCheck(`
fn foo (int tex) {
  return frag(tex) / float(tex);
}`)
      ).to.throw("mixed use");
    });
  });

  it("throws when param used normally then for tex num", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int tex) {
  return float(tex) * frag(tex);
}`)
    ).to.throw("mixed use");
  });

  it("usage status gets passed up through function", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int tex) {
  return frag(tex);
}

fn bar (int tex) {
  return float(tex) * foo(tex);
}`)
    ).to.throw("mixed use");
  });

  it("usage status gets passed up through procedure", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int tex) {
  return frag(tex);
}

pr bar (int tex) {
  float(tex) * foo(tex);
}`)
    ).to.throw("mixed use");
  });
});

describe("proc call", () => {
  it("checks proc with two args", () => {
    const proc = new ProcCall(tok("("), new IdentExpr(tok("some_proc")), [
      new IntExpr(tok("1")),
      new IntExpr(tok("2")),
    ]);
    checkProgram("{@some_proc(1, 2);}", [
      new RenderBlock(false, [proc], null, null, null, tok("{")),
    ]);
  });
  // TODO more proc call tests
});

describe("color strings", () => {
  it("parses a color string single quotes no number", () => {
    checkExpr("'red'", new ColorString(tok("'red'")));
  });

  it("parses a color string double quotes with number", () => {
    checkExpr('"red"', new ColorString(tok('"red"')));
  });

  it("parses a color string single quotes no number", () => {
    checkExpr("'red'3", new ColorString(tok("'red'"), 3));
  });

  it("parses a color string double quotes with number", () => {
    checkExpr("'red'3", new ColorString(tok("'red'"), 3));
  });
});

describe("calling with named arguments", () => {
  it("calls a function with named argument", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a) { return a; }
fn bar() { return foo(a: 2); }`)
    ).to.not.throw();
  });

  it("calls a function with named argument leaving off default", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b = 2) { return a + b; }
fn bar() { return foo(a: 2); }`)
    ).to.not.throw();
  });

  it("throws when calling a named argument that does not exist", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b = 2) { return a + b; }
fn bar() { return foo(c: 2); }`)
    ).to.throw("does not exist");
  });

  it("passes in named arguments out of order", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c, int d = 2) { return a + b; }
fn bar() { return foo(b: 0, a: 1, c: 2); }`)
    ).to.not.throw();
  });

  it("does not name all required arguments, throws", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c, int d = 2) { return a + b; }
fn bar() { return foo(a: 0, c: 2); }`)
    ).to.throw("not filled in");
  });

  it("throws too few when missing arg is trailing", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c, int d = 2) { return a + b; }
fn bar() { return foo(a: 0, b: 2); }`)
    ).to.throw("not filled in");
  });

  it("throws when named argument is declared twice", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c) { return a; }
fn bar() { return foo(a: 3, a: 2); }`)
    ).to.throw("repeat");
  });

  it("throws when named args and regular args are mixed", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c, int d = 2) { return a + b; }
fn bar() { return foo(0, b: 2, c: 3, a: 4); }`)
    ).to.throw("mix");
  });

  it("works when all defaults and middle named is passed", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a = 1, int b = 2, int c = 3, int d = 4) { return a + b; }
fn bar() { return foo(b: 2); }`)
    ).to.not.throw();
  });

  it("whitespace after colon allowed for named arguments", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b, int c, int d = 2) { return a + b; }
fn bar() { return foo(b\t: 0, a\n: 1, c    : 2); }`)
    ).to.not.throw();
  });
});

describe("default parameter validation", () => {
  it("throws when default parameters are not trailing", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b = 2, int c, int d = 2) {
  return a + b + c + d;
}`)
    ).to.throw("trailing");
  });

  it("throws when default parameters are the wrong types", () => {
    expect(() =>
      parseAndCheck(`
fn foo (int a, int b = 2.) {
  return a + b;
}`)
    ).to.throw("type");
  });
});

// TODO parsing empty program
