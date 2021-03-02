import { expect } from "chai";
import { Token } from "moo";
import nearley from "nearley";
import util from "util";
import grammar from "./grammar";

export function tok(val: string): Token {
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

export function parse(str: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
  } catch (e) {
    console.error("parser error");
  }
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

function extractExpr(str: string, semicolon: boolean) {
  return parse(`float f () {${str}${semicolon ? ";" : ""}}`)[0].body[0];
}

const excludes = ["toString", "offset", "lineBreaks", "line", "col", "type"];

// TODO rename
export function checkExpr(str: string, eql: object, semicolon = true) {
  expect(extractExpr(str, semicolon))
    .excludingEvery(excludes)
    .to.deep.equal(eql);
}

export function checkProgram(str: string, eql: object) {
  expect(parse(str)).excludingEvery(excludes).to.deep.equal(eql);
}
