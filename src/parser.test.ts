import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import * as nearley from "nearley";
import grammar from "./grammar";
import { Token } from "moo";
import { BinaryExpr, BoolExpr, IntExpr, UnaryExpr } from "./nodes";

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
