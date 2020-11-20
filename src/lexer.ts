import * as moo from "moo";

export const lexer = moo.compile({
  ws: /[ \t]+/,
  lb: { match: /\n/, lineBreaks: true },
  float: /[+-]?(?:[0-9]*\.[0-9]+|[0-9]+\.)/,
  int: /[-+]?[0-9]+/,
  arrow: "->",
  lte: "<=",
  lt: "<",
  gte: ">=",
  gt: ">",
  eq: "==",
  assignment: "=",
  lparen: "(",
  rparen: ")",
  lbrace: "{",
  rbrace: "}",
  lbracket: "[",
  rbracket: "]",
  comma: ",",
  add: "+",
  sub: "-",
  mult: "*",
  div: "/",
  modulo: "%",
  qmark: "?",
  colon: ":",
  semicolon: ";",
  period: ".",
  comment: /\/\/.*?$/,
  identifier: {
    match: /[_a-zA-Z][_a-zA-Z0-9]+/,
    type: moo.keywords(
      Object.fromEntries(
        [
          "if",
          "else",
          "for",
          "while",
          "do",
          "switch",
          "case",
          "default",
          "break",
          "fn",
          "pr",
          "bool",
          "int",
          "float",
          "vec2",
          "vec3",
          "vec4",
          "mat2",
          "mat3",
          "mat4",
          "bvec2",
          "bvec3",
          "bvec4",
          "ivec2",
          "ivec3",
          "ivec4",
          "true",
          "false",
        ].map((k) => ["kw-" + k, k])
      )
    ),
  },
});

lexer.reset("vec4 color = vec4(1., 0.1, 3.0, 0.);\n");
while (true) {
  const next = lexer.next();
  if (next === undefined) break;
  console.log(next);
}
