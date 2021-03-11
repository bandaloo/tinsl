import * as moo from "moo";

// TODO unsigned int

// https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf p18
// "The maximum length of an identifier is 1024 characters." p20
export const keywords = [
  // specific to glsl
  "const",
  "uniform",
  "layout",
  "centroid",
  "flat",
  "smooth",
  "break",
  "continue",
  "do",
  "for",
  "while",
  "switch",
  "case",
  "default",
  "if",
  "else",
  "in",
  "out",
  "inout",
  "float",
  "int",
  "void",
  "bool",
  "true",
  "false",
  "invariant",
  "discard",
  "return",
  "mat2",
  "mat3",
  "mat4",
  "mat2x2",
  "mat2x3",
  "mat2x4",
  "mat3x2",
  "mat3x3",
  "mat3x4",
  "mat4x2",
  "mat4x3",
  "mat4x4",
  "vec2",
  "vec3",
  "vec4",
  "ivec2",
  "ivec3",
  "ivec4",
  "bvec2",
  "bvec3",
  "bvec4",
  "uint",
  "uvec2",
  "uvec3",
  "uvec4",
  "lowp",
  "mediump",
  "highp",
  "precision",
  "sampler2D",
  "sampler3D",
  "samplerCube",
  "sampler2DShadow",
  "samplerCubeShadow",
  "sampler2DArray",
  "sampler2DArrayShadow",
  "isampler2D",
  "isampler3D",
  "isamplerCube",
  "isampler2DArray",
  "usampler2D",
  "usampler3D",
  "usamplerCube",
  "usampler2DArray",
  "struct",
  // reserved for glsl
  "attribute",
  "varying",
  "coherent",
  "volatile",
  "restrict",
  "readonly",
  "writeonly",
  "resource",
  "atomic_uint",
  "noperspective",
  "patch",
  "sample",
  "subroutine",
  "common",
  "partition",
  "active",
  "asm",
  "class",
  "union",
  "enum",
  "typedef",
  "template",
  "this",
  "goto",
  "inline",
  "noinline",
  "volatile",
  "public",
  "static",
  "extern",
  "external",
  "interface",
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
  "sampler3DRect",
  "filter",
  "image1D",
  "image2D",
  "image3D",
  "imageCube",
  "iimage1D",
  "iimage2D",
  "iimage3D",
  "iimageCube",
  "uimage1D",
  "uimage2D",
  "uimage3D",
  "uimageCube",
  "image1DArray",
  "image2DArray",
  "iimage1DArray",
  "iimage2DArray",
  "uimage1DArray",
  "uimage2DArray",
  "imageBuffer",
  "iimageBuffer",
  "uimageBuffer",
  "sampler1D",
  "sampler1DShadow",
  "sampler1DArray",
  "sampler1DArrayShadow",
  "isampler1D",
  "isampler1DArray",
  "usampler1D",
  "usampler1DArray",
  "sampler2DRect",
  "sampler2DRectShadow",
  "isampler2DRect",
  "usampler2DRect",
  "samplerBuffer",
  "isamplerBuffer",
  "usamplerBuffer",
  "sampler2DMS",
  "isampler2DMS",
  "usampler2DMS",
  "sampler2DMSArray",
  "isampler2DMSArray",
  "usampler2DMSArray",
  "sizeof",
  "cast",
  "namespace",
  "using",
  // specific to tinsl
  "fn",
  "pr",
  "let", // TODO not used
  "final",
  "mut",
  "def",
  "once",
  "loop",
  "refresh",
  "res",
  "pos",
  "time",
  // types added for generics
  // TODO get rid of these
  "genType",
  "genBType",
  "genIType",
  "genUType",
  "mat",
  "vec",
  "bvec",
  "ivec",
  "uvec",
] as const;

export const lexer = moo.compile({
  lbc: {
    //match: /(?:[\t ]+\n+[\t ]+|[ \t]+\n+|\n+[\t ]+|\n+)+/,
    // TODO is this redundant?
    //match: /(?:[ \t\n]+;[ \t\n]+|[ \t\n]+;|;[ \t\n]+|;)/,
    match: /[ \t\n]*;/,
    lineBreaks: true,
  },
  ws: { match: /[ \t\n]+/, lineBreaks: true },
  //lb: { match: /\n/, lineBreaks: true },
  comment: /\/\/.*?$/,
  multiline_comment: /\/\*[^]*?\*\//,
  float: /(?:[0-9]*\.[0-9]+|[0-9]+\.)/,
  uint: /[0-9]+u/,
  int: /[0-9]+/,
  assign_add: "+=",
  assign_sub: "-=",
  assign_mult: "*=",
  assign_div: "/=",
  assign_modulo: "%=", // TODO reserved
  assign_band: "&=", // TODO reserved
  assign_bxor: "^=", // TODO reserved
  assign_bor: "|=", // TODO reserved
  incr: "++",
  decr: "--",
  assign_blshift: "<<=", // TODO reserved
  assign_brshift: ">>=", // TODO reserved
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
  xor: "^^",
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
  decl: ":=",
  colon: ":",
  semicolon: ";", // TODO remove this
  period: ".",
  at: "@",
  frag: {
    match: /frag[0-9]*/,
  },
  ident: {
    match: /[_a-zA-Z][_a-zA-Z0-9]*/,
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
