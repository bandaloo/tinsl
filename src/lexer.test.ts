import { expect } from "chai";
import { keywords, lexer } from "./lexer";

import { Token, Lexer } from "moo";

/** returns types of all tokens */
const types = (tokens: Token[]) => tokens.map((t) => t.type);

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
    expect(types(tokens(lexer, "0 12 012 00012"))).to.deep.equal(
      uniform("int", 4)
    );
  });

  it("lexes floats left of decimal", () => {
    expect(types(tokens(lexer, "0. 12. 012. 00012."))).to.deep.equal(
      uniform("float", 4)
    );
  });

  it("lexes floats right of decimal", () => {
    expect(types(tokens(lexer, ".0 .12 .012 .00012"))).to.deep.equal(
      uniform("float", 4)
    );
  });

  it("lexes floats both side of decimal", () => {
    expect(types(tokens(lexer, "0.0 1.12 22.012 00123.00012"))).to.deep.equal(
      uniform("float", 4)
    );
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
      separate(["add", "sub", "mult", "div", "modulo"])
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
    expect(types(tokens(lexer, "& ^ | << >> ~"))).to.deep.equal(
      separate(["band", "bxor", "bor", "blshift", "brshift", "bnot"])
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
        "assign_add",
        "assign_sub",
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

  it("lexes access operators", () => {
    expect(types(tokens(lexer, ". ->"))).to.deep.equal(
      separate(["period", "arrow"])
    );
  });

  it("lexes keywords", () => {
    expect(types(tokens(lexer, keywords.join(" ")))).to.deep.equal(
      separate(keywords.map((s) => "kw_" + s))
    );
  });
});

describe("comments", () => {
  it("lexes single line comment", () => {
    expect(types(tokens(lexer, "// some comment"))).to.deep.equal(["comment"]);
  });

  it("lexes empty single line comment", () => {
    expect(types(tokens(lexer, "//"))).to.deep.equal(["comment"]);
  });

  it("lexes nested single line comment", () => {
    expect(types(tokens(lexer, "// some // comment"))).to.deep.equal([
      "comment",
    ]);
  });

  it("lexes two single line comments", () => {
    expect(types(tokens(lexer, "// some\n// comment"))).to.deep.equal([
      "comment",
      "lbc",
      "comment",
    ]);
  });

  it("lexes multiline comment on one line", () => {
    expect(types(tokens(lexer, "/* some comment */"))).to.deep.equal([
      "multiline_comment",
    ]);
  });

  it("lexes empty multiline comment", () => {
    expect(types(tokens(lexer, "/**/"))).to.deep.equal(["multiline_comment"]);
  });

  it("lexes multiline comment on multiple lines", () => {
    expect(types(tokens(lexer, "/*\nsome\ncomment\n*/"))).to.deep.equal([
      "multiline_comment",
    ]);
  });

  it("lexes two multiline comments", () => {
    expect(
      types(tokens(lexer, "/* some comment */\n/*\nsome\ncomment\n*/"))
    ).to.deep.equal(["multiline_comment", "lbc", "multiline_comment"]);
  });
});

describe("identifiers", () => {
  it("lexes an identifier", () => {
    expect(
      types(tokens(lexer, "_some_arb1traryIdentifier_123"))
    ).to.deep.equal(["ident"]);
  });

  it("lexes an identifier and number", () => {
    expect(
      types(tokens(lexer, "99some_arb1traryIdentifier_123"))
    ).to.deep.equal(["int", "ident"]);
  });

  it("lexes identifier containing keywords", () => {
    expect(types(tokens(lexer, "for_a_while"))).to.deep.equal(["ident"]);
  });
});

describe("whitespace", () => {
  it("single newline linebreak chunk", () => {
    expect(types(tokens(lexer, "\n"))).to.deep.equal(["lbc"]);
  });

  it("multiple newline linebreak chunk", () => {
    expect(types(tokens(lexer, "\n\n\n"))).to.deep.equal(["lbc"]);
  });

  it("multiple newline linebreak chunk inner spaces", () => {
    expect(types(tokens(lexer, "\n \n\n \n"))).to.deep.equal(["lbc"]);
  });

  it("multiple newline linebreak chunk outer spaces", () => {
    expect(types(tokens(lexer, "  \n \n\n \n  "))).to.deep.equal(["lbc"]);
  });
});
