import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import { lexer } from "./lexer";

import type { Token, Lexer } from "moo";

/** returns types of all tokens */
const types = (tokens: Token[]) => tokens.map((t) => t.type);

/** returns values of all tokens */
const values = (tokens: Token[]) => tokens.map((t) => t.value);

/** helper function to return uniform list separated by whitespace */
function uniform(s: string, n: number) {
  return [...Array(n)]
    .map(() => [s, "ws"])
    .flat()
    .slice(0, n * 2 - 1);
}

const tokens = (lexer: Lexer, str: string) => {
  lexer.reset(str);
  const arr: Token[] = [];
  while (true) {
    const next = lexer.next();
    if (next === undefined) break;
    arr.push(next);
  }
  return arr;
};

describe("numbers", () => {
  it("lexes ints", () => {
    expect(
      types(
        tokens(lexer, "0 12 012 00012 +0 +12 +012 +00012 -0 -12 -012 -00012")
      )
    ).to.deep.equal(uniform("int", 12));
  });

  it("lexes floats left of decimal", () => {
    expect(
      types(
        tokens(
          lexer,
          "0. 12. 012. 00012. +0. +12. +012. +00012. -0. -12. -012. -00012."
        )
      )
    ).to.deep.equal(uniform("float", 12));
  });

  it("lexes floats right of decimal", () => {
    expect(
      types(
        tokens(
          lexer,
          ".0 .12 .012 .00012 +.0 +.12 +.012 +.00012 -.0 -.12 -.012 -.00012"
        )
      )
    ).to.deep.equal(uniform("float", 12));
  });

  it("lexes floats both side of decimal", () => {
    expect(
      types(
        tokens(
          lexer,
          "0.0 1.12 22.012 00123.00012 +0.0 +1.12 +22.012 +123.00012 -0.0 -1.12 -22.012 -123.00012"
        )
      )
    ).to.deep.equal(uniform("float", 12));
  });

  it("lexes `.` as period, not number", () => {
    expect(types(tokens(lexer, "."))).to.deep.equal(["period"]);
  });
});
