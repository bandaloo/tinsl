import * as moo from "moo";

// https://www.khronos.org/files/opengles_shading_language.pdf p16
export const keywords = [
  "if",
  "else",
  "for",
  "continue",
  "attribute",
  "const",
  "uniform",
  "varying",
  "sampler2D",
  "samplerCube",
  "lowp",
  "mediump",
  "highp",
  "precision",
  "invariant",
  "discard",
  "struct",
  "while",
  "do",
  "switch",
  "case",
  "default",
  "break",
  "bool",
  "int",
  "float",
  "vec2",
  "vec3",
  "vec4",
  "mat2",
  "mat3",
  "mat4",
  "true",
  "false",
  "return",
  // specific to tinsl
  "fn",
  "pr",
  "let",
  "def",
  "once",
  "loop",
  // reserved by glsl but not allowed in tinsl (for now)
  "in",
  "out",
  "inout",
  "bvec2",
  "bvec3",
  "bvec4",
  "ivec2",
  "ivec3",
  "ivec4",
  // reserved for future use by glsl
  "asm",
  "class",
  "union",
  "enum",
  "typedef",
  "template",
  "this",
  "packed",
  "goto",
  "switch",
  "default",
  "inline",
  "noinline",
  "volatile",
  "public",
  "static",
  "extern",
  "external",
  "interface",
  "flat",
  "long",
  "short",
  "double",
  "half",
  "fixed",
  "unsigned",
  "superp",
  "input",
  "output",
  "hvec2",
  "hvec3",
  "hvec4",
  "dvec2",
  "dvec3",
  "dvec4",
  "fvec2",
  "fvec3",
  "fvec4",
  "sampler1D",
  "sampler3D",
  "sampler1DShadow",
  "sampler2DShadow",
  "sampler2DRect",
  "sampler3DRect",
  "sampler2DRectShadow",
  "sizeof",
  "cast",
  "namespace",
  "using",
] as const;

export const lexer = moo.compile({
  lbc: {
    match: /(?:[\t ]+\n+[\t ]+|[ \t]+\n+|\n+[\t ]+|\n+)+/,
    lineBreaks: true,
  },
  ws: /[ \t]+/,
  //lb: { match: /\n/, lineBreaks: true },
  comment: /\/\/.*?$/,
  multiline_comment: /\/\*[^]*?\*\//,
  float: /(?:[0-9]*\.[0-9]+|[0-9]+\.)/,
  int: /[0-9]+/,
  assign_add: "+=",
  assign_sub: "-=",
  assign_mult: "*=",
  assign_div: "/=",
  assign_modulo: "%=",
  assign_band: "&=",
  assign_bxor: "^=",
  assign_bor: "|=",
  incr: "++",
  decr: "--",
  assign_blshift: "<<=",
  assign_brshift: ">>=",
  blshift: "<<",
  brshift: ">>",
  arrow: "->",
  lte: "<=",
  lt: "<",
  gte: ">=",
  gt: ">",
  eq: "==",
  neq: "!=",
  and: "&&",
  or: "||",
  band: "&",
  bxor: "^",
  bor: "|",
  not: "!",
  bnot: "~",
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
  question_mark: "?",
  colon: ":",
  semicolon: ";",
  period: ".",
  identifier: {
    match: /[_a-zA-Z][_a-zA-Z0-9]+/,
    type: moo.keywords(Object.fromEntries(keywords.map((k) => ["kw_" + k, k]))),
  },
});

/*
lexer.reset("vec4 color = vec4(1., 0.1, 3.0, 0.);\n");
while (true) {
  const next = lexer.next();
  if (next === undefined) break;
  console.log(next);
}
*/
