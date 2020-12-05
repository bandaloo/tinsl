import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import * as nearley from "nearley";
import grammar from "./grammar";
import { Token } from "moo";
import { BinaryExpr, IntExpr } from "./nodes";

chai.use(chaiExclude);

function parse(str: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  parser.feed(str);
  if (parser.results.length > 1) throw new Error("ambiguous grammar!");
  return parser.results[0];
}

function checkExpr(str: string, eql: object) {
  const excludes = ["toString", "offset", "lineBreaks", "line", "col", "type"];
  expect(parse(`{${str}}->0`)[0].expressions[0])
    .excludingEvery(excludes)
    .to.deep.equal(eql);
}

/** creates a mock token */
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

describe("expressions", () => {
  it("order of ops", () => {
    checkExpr(
      "1+2-3",
      new BinaryExpr(
        tok("-"),
        new BinaryExpr(tok("+"), new IntExpr(tok("1")), new IntExpr(tok("2"))),
        new IntExpr(tok("3"))
      )
    );
  });
});
