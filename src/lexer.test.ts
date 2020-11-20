import chai, { expect } from "chai";
import chaiExclude from "chai-exclude";
import { lexer } from "./lexer";

import type { Token, Lexer } from "moo";

/** returns types of all tokens */
const types = (tokens: Token[]) => tokens.map((t) => t.type);

/** returns values of all tokens */
const values = (tokens: Token[]) => tokens.map((t) => t.value);

/** helper function to put "ws" between all elements in array */
const separate = (arr: string[]) =>
  arr
    .map((s) => [s, "ws"])
    .flat()
    .slice(0, arr.length * 2 - 1);

/** helper function to return uniform list separated by whitespace */
const uniform = (s: string, n: number) => separate([...Array(n)].map(() => s));

/** helper function to get array of all tokens from lexer */
const tokens = (lexer: Lexer, str: string) => {
  lexer.reset(str);
  return Array.from(lexer);
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

describe("operators", () => {
  it("lexes grouping operators", () => {
    expect(types(tokens(lexer, "(){}[]"))).to.deep.equal([
      "lparen",
      "rparen",
      "lbrace",
      "rbrace",
      "lbracket",
      "rbracket",
    ]);
  });

  it("lexes arithmetic operators", () => {
    expect(types(tokens(lexer, "+ - * / %"))).to.deep.equal(
      separate(["plus", "minus", "mult", "div", "modulo"])
    );
  });

  it("lexes relational operators", () => {
    expect(types(tokens(lexer, "> < >= <="))).to.deep.equal(
      separate(["gt", "lt", "gte", "lte"])
    );
  });

  it("lexes assignment operators", () => {
    expect(types(tokens(lexer, "== !="))).to.deep.equal(
      separate(["eq", "neq"])
    );
  });

  it("lexes bitwise operators", () => {
    expect(types(tokens(lexer, "& ^ | << >>"))).to.deep.equal(
      separate(["band", "bxor", "bor", "blshift", "brshift"])
    );
  });

  it("lexes logical operators", () => {
    expect(types(tokens(lexer, "&& || !"))).to.deep.equal(
      separate(["and", "or", "not"])
    );
  });

  it("lexes assignment operators", () => {
    expect(
      types(tokens(lexer, "= += -= *= /= %= &= ^= |= <<= >>="))
    ).to.deep.equal(
      separate([
        "assignment",
        "assign_plus",
        "assign_minus",
        "assign_mult",
        "assign_div",
        "assign_modulo",
        "assign_band",
        "assign_bxor",
        "assign_bor",
        "assign_blshift",
        "assign_brshift",
      ])
    );
  });

  it("lexes ternary operators", () => {
    expect(types(tokens(lexer, "?:"))).to.deep.equal([
      "question_mark",
      "colon",
    ]);
  });

  it("lexes increment and decrement operators", () => {
    expect(types(tokens(lexer, "++--"))).to.deep.equal(["incr", "decr"]);
  });
});
