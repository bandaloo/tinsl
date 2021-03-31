import * as moo from "moo";
import { TinslError } from "./err";

// https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf p18
// "The maximum length of an identifier is 1024 characters." p20

export const types = [
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
  "float",
  "int",
  "bool",
] as const;

export const precision = ["lowp", "mediump", "highp"] as const;

// currently unused
export const generics = [
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

export const overlap = [
  "const",
  "uniform",
  "continue", // TODO
  "break", // TODO
  "for",
  "if",
  "else",
  "true",
  "false",
  "return",
] as const;

export const tinsl = [
  "fn",
  "pr",
  "final",
  "mut",
  "def",
  "once",
  "loop",
  "refresh",
  "res",
  "pos",
  "npos",
  "time",
  "prev",
] as const;

export const glsl = [
  "layout",
  "centroid",
  "flat",
  "smooth",
  "do",
  "while",
  "switch",
  "case",
  "default",
  "in",
  "out",
  "inout",
  "void",
  "invariant",
  "discard",
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
] as const;

export const future = [
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
] as const;

const reserved = new Set([
  ...precision,
  ...glsl,
  ...future,
  "fragColor",
  "int_non_const_identity",
  "uint_non_const_identity",
] as string[]);

export const regexes = {
  float: /(?:[0-9]*\.[0-9]+|[0-9]+\.)/,
  uint: /[0-9]+u/,
  int: /[0-9]+/,
  string: /(?:".*?"|'.*?')/,
  comment: /\/\/.*?$/,
  multilineComment: /\/\*[^]*?\*\//,
  ident: /[_a-zA-Z][_a-zA-Z0-9]*/,
  frag: /frag[0-9]*/,
};

/** throws when the string is an invalid identifier */
export function validIdent(str: string) {
  if (/^gl_*/.test(str)) {
    throw new TinslError("identifier cannot start with `gl_`");
  }

  if (/__/.test(str)) {
    throw new TinslError("identifier cannot contain a double underscore");
  }

  if (reserved.has(str)) {
    throw new TinslError(`\`${str}\` is a reserved keyword`);
  }

  if (str.length > 1024) {
    throw new TinslError("identifier cannot be over 1024 characters in length");
  }
}

// TODO add fragColor
export const keywords = [...tinsl, ...overlap, ...types] as const;

// TODO break all these regexes out so they can be used by editor
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
  comment: regexes.comment,
  string: regexes.string,
  multiline_comment: { match: regexes.multilineComment, lineBreaks: true },
  float: regexes.float,
  uint: regexes.uint,
  int: regexes.int,
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
  frag: { match: regexes.frag },
  ident: {
    match: regexes.ident,
    type: moo.keywords(Object.fromEntries(keywords.map((k) => ["kw_" + k, k]))),
  },
});
