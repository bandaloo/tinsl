import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import * as nearley from "nearley";
import grammar from "./grammar";
import { Token } from "moo";
import {
  BinaryExpr,
  BoolExpr,
  CallExpr,
  ConstructorExpr,
  Decl,
  FloatExpr,
  IdentExpr,
  IntExpr,
  TypeName,
  UnaryExpr,
} from "./nodes";

chai.use(chaiExclude);

function parse(str: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(str);
  if (parser.results.length > 1) throw new Error("ambiguous grammar!");
  return parser.results[0];
}

function extractExpr(str: string) {
  return parse(`{${str}}->0`)[0].expressions[0];
}

function checkExpr(str: string, eql: object) {
  const excludes = ["toString", "offset", "lineBreaks", "line", "col", "type"];
  expect(extractExpr(str)).excludingEvery(excludes).to.deep.equal(eql);
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
  it("parses constant variable declaration float", () => {
    checkExpr(
      "const float foo = 1.",
      new Decl(
        true,
        new TypeName(tok("float")),
        tok("foo"),
        new FloatExpr(tok("1.")),
        tok("=")
      )
    );
  });

  /*
  it("parses constant variable declaration float", () => {
    checkExpr(
      "const vec2 foo = vec2(1., 2.)",
      new Decl(true, tok("vec2"), tok("foo"), new CallExpr(tok("("), ))
    );
  });
  */
});
