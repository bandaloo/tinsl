import { expect } from "chai";
import { Lexer, Token } from "moo";
import { keywords, lexer } from "./lexer";

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

  it("lexes uints", () => {
    expect(types(tokens(lexer, "0u 12u 012u 00012u"))).to.deep.equal(
      uniform("uint", 4)
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
      "ws",
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
    ).to.deep.equal(["multiline_comment", "ws", "multiline_comment"]);
  });
});

describe("strings", () => {
  it("lexes string single quote", () => {
    expect(types(tokens(lexer, "'hello'"))).to.deep.equal(["string"]);
  });

  it("lexes string double quote", () => {
    expect(types(tokens(lexer, '"hello"'))).to.deep.equal(["string"]);
  });

  it("lexes empty string single quote", () => {
    expect(types(tokens(lexer, "''"))).to.deep.equal(["string"]);
  });

  it("lexes empty string double quote", () => {
    expect(types(tokens(lexer, '""'))).to.deep.equal(["string"]);
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

  it("lexes single character identifier", () => {
    expect(types(tokens(lexer, "b"))).to.deep.equal(["ident"]);
  });
});

describe("semicolons", () => {
  it("lexes semicolon alone", () => {
    expect(types(tokens(lexer, ";"))).to.deep.equal(["lbc"]);
  });

  it("lexes semicolon ws start", () => {
    expect(types(tokens(lexer, "\n ;"))).to.deep.equal(["lbc"]);
  });

  it("lexes semicolon ws end", () => {
    expect(types(tokens(lexer, ";\n "))).to.deep.equal(["lbc", "ws"]);
  });

  it("lexes semicolon ws both sides", () => {
    expect(types(tokens(lexer, "\n ;\n "))).to.deep.equal(["lbc", "ws"]);
  });

  it("lexes multiple semicolons alone", () => {
    expect(types(tokens(lexer, ";;"))).to.deep.equal(["lbc", "lbc"]);
  });

  // TODO make this test more clear
  it("lexes multiple semicolons ws", () => {
    expect(types(tokens(lexer, "\n ;;"))).to.deep.equal(["lbc", "lbc"]);
    expect(types(tokens(lexer, ";;\n "))).to.deep.equal(["lbc", "lbc", "ws"]);
    expect(types(tokens(lexer, ";\n ;"))).to.deep.equal(["lbc", "lbc"]);
    expect(types(tokens(lexer, "\n ;;\n "))).to.deep.equal([
      "lbc",
      "lbc",
      "ws",
    ]);
    expect(types(tokens(lexer, "\n ;\n ;\n "))).to.deep.equal([
      "lbc",
      "lbc",
      "ws",
    ]);
  });
});

describe("whitespace", () => {
  it("lexes tabs", () => {
    expect(types(tokens(lexer, "\t"))).to.deep.equal(["ws"]);
    expect(types(tokens(lexer, "\t\t\t"))).to.deep.equal(["ws"]);
  });

  it("lexes newlines", () => {
    expect(types(tokens(lexer, "\n"))).to.deep.equal(["ws"]);
    expect(types(tokens(lexer, "\n\n\n"))).to.deep.equal(["ws"]);
  });

  it("lexes spaces", () => {
    expect(types(tokens(lexer, " "))).to.deep.equal(["ws"]);
    expect(types(tokens(lexer, "   "))).to.deep.equal(["ws"]);
  });

  it("lexes mix", () => {
    expect(types(tokens(lexer, " \n\t"))).to.deep.equal(["ws"]);
    expect(types(tokens(lexer, "  \n\n\t\t  \n\n\t\t"))).to.deep.equal(["ws"]);
  });
});
