import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import * as nearley from "nearley";
import grammar from "./grammar";
import { Token } from "moo";
import {
  Assign,
  BinaryExpr,
  BoolExpr,
  CallExpr,
  ConstructorExpr,
  Decl,
  FloatExpr,
  FuncDef,
  IdentExpr,
  IntExpr,
  Param,
  RenderBlock,
  Return,
  TernaryExpr,
  TypeName,
  UnaryExpr,
} from "./nodes";
import util from "util";

chai.use(chaiExclude);

// TODO move this into parser.ts
function parse(str: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(str);
  if (parser.results.length > 1) {
    console.log(
      util.inspect(parser.results, {
        showHidden: false,
        depth: null,
        colors: true,
      })
    );
    throw new Error("ambiguous grammar! length: " + parser.results.length);
  }
  return parser.results[0];
}

function extractExpr(str: string) {
  return parse(`{${str};}->0`)[0].expressions[0];
}

const excludes = ["toString", "offset", "lineBreaks", "line", "col", "type"];

function checkExpr(str: string, eql: object) {
  expect(extractExpr(str)).excludingEvery(excludes).to.deep.equal(eql);
}

function checkProgram(str: string, eql: object) {
  expect(parse(str)).excludingEvery(excludes).to.deep.equal(eql);
}

function tok(val: string): Token {
  return {
    toString: () => val,
    value: val,
    offset: -1,
    text: val,
    lineBreaks: -1,
    line: -1,
    col: -1,
  };
}

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
  new IntExpr(tok("1")),
  tok("|"),
  new BinaryExpr(
    new IntExpr(tok("2")),
    tok("^"),
    new BinaryExpr(new IntExpr(tok("3")), tok("&"), new IntExpr(tok("4")))
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
            : args.length + "x" + args[0].length)
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

const vec2Decl = new Decl(
  true,
  new TypeName(tok("float")),
  tok("bar"),
  vec(1, 2),
  tok("=")
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
    checkExpr("1 | 2 ^ 3 & 4", bitwiseReverse);
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
    checkExpr("vec2(0., 1., 2., 3.)", vec(0, 1, 2, 3));
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
      "mat2x2(0., 1., 2., 3., 4., 5.)",
      mat(true, [0, 1], [2, 3], [4, 5])
    );
  });

  it("parses mat2x4 constructor call", () => {
    checkExpr(
      "mat2x2(0., 1., 2., 3., 4., 5., 6., 7.)",
      mat(true, [0, 1], [2, 3], [4, 5], [6, 7])
    );
  });

  it("parses mat3x2 constructor call", () => {
    checkExpr(
      "mat3x3(0., 1., 2., 3., 4., 5.)",
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
      "mat3x3(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.)",
      mat(true, [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11])
    );
  });

  it("parses mat4x2 constructor call", () => {
    checkExpr(
      "mat4x4(0., 1., 2., 3., 4., 5., 6., 7.)",
      mat(true, [0, 1, 2, 3], [4, 5, 6, 7])
    );
  });

  it("parses mat4x3 constructor call", () => {
    checkExpr(
      "mat4x4(0., 1., 2., 3., 4., 5., 6., 7., 8., 9., 10., 11.)",
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
  it("parses non-constant variable declaration float", () => {
    checkExpr(
      "float foo = 1.",
      new Decl(
        false,
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
});

describe("assignment", () => {
  it("parses direct assignment", () => {
    checkExpr("foo = 1.", assignFloat("foo", "=", "1."));
  });

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

describe("function declaration", () => {
  it("parses function declaration two arguments no defaults", () => {
    checkProgram("float foo (vec2 bar, vec3 baz) { return 1.; }", [
      new FuncDef(
        new TypeName(tok("float")),
        tok("foo"),
        [
          new Param(new TypeName(tok("vec2")), tok("bar")),
          new Param(new TypeName(tok("vec3")), tok("baz")),
        ],
        [new Return(new FloatExpr(tok("1.")), tok("return"))]
      ),
    ]);
  });

  it("parses function declaration two arguments defaults", () => {
    checkProgram("float foo (float bar = .1, float baz = .2) { return 1.; }", [
      new FuncDef(
        new TypeName(tok("float")),
        tok("foo"),
        [
          new Param(
            new TypeName(tok("float")),
            tok("bar"),
            new FloatExpr(tok(".1"))
          ),
          new Param(
            new TypeName(tok("float")),
            tok("baz"),
            new FloatExpr(tok(".2"))
          ),
        ],
        [new Return(new FloatExpr(tok("1.")), tok("return"))]
      ),
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
});

describe("top level", () => {
  const bl = new RenderBlock(false, [vec(1, 2, 3, 4)], null, 0, null, tok("{"));
  const completeBlock = new RenderBlock(
    true,
    [vec(1, 2, 3, 4), vec(5, 6, 7, 8)],
    0,
    1,
    2,
    tok("{")
  );

  it("parses a render block minimal options minimal ws", () => {
    checkProgram("{vec4(1., 2., 3., 4.);}->0", [bl]);
  });

  it("parses render block surrounding whitespace", () => {
    checkProgram(" \n\t{vec4(1., 2., 3., 4.);}->0 \n\t", [bl]);
  });

  it("parses a render block with all options", () => {
    checkProgram(
      `0 -> loop 2 once {
  vec4(1., 2., 3., 4.);
  vec4(5., 6., 7., 8.);
} -> 1`,
      [completeBlock]
    );
  });

  it("parses a render block with all options minimal ws", () => {
    checkProgram(
      `0->loop 2once{vec4(1., 2., 3., 4.);vec4(5., 6., 7., 8.);}->1`,
      [completeBlock]
    );
  });

  it("parses two render blocks", () => {
    checkProgram("{vec4(1., 2., 3., 4.);}->0\n{vec4(1., 2., 3., 4.);}->0", [
      bl,
      bl,
    ]);
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

// TODO parsing empty program
