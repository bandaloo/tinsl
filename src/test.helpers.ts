import { expect } from "chai";
import { Token } from "moo";
import { Stmt } from "./nodes";
import { parse, parseAndCheck } from "./gen";

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

export function extractExpr(str: string, semicolon: boolean) {
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

export const extractTopLevel = <T extends Stmt>(str: string, index = 0) =>
  parseAndCheck(str)[index] as T;
