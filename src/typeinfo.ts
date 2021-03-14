export type GenTypeSimple =
  | "genType"
  | "genBType"
  | "genIType"
  | "genUType"
  | "mat"
  | "vec"
  | "bvec"
  | "ivec"
  | "uvec";

export type GenType =
  | "genType"
  | "genBType"
  | "genIType"
  | "genUType"
  | "mat"
  | "vec"
  | "bvec"
  | "ivec"
  | "uvec"
  | ArrayType<GenTypeSimple>;

// TODO export this and spread it in lexer to get rid of repeated info
export type SpecTypeSimple =
  | "float"
  | "int"
  | "bool"
  | "uint"
  | "vec2"
  | "vec3"
  | "vec4"
  | "ivec2"
  | "ivec3"
  | "ivec4"
  | "uvec2"
  | "uvec3"
  | "uvec4"
  | "bvec2"
  | "bvec3"
  | "bvec4"
  | "mat2"
  | "mat3"
  | "mat4"
  | "mat2x2"
  | "mat2x3"
  | "mat2x4"
  | "mat3x2"
  | "mat3x3"
  | "mat3x4"
  | "mat4x2"
  | "mat4x3"
  | "mat4x4"
  | "__undecided"; // TODO really think about this one

export type SpecType = SpecTypeSimple | ArrayType<SpecTypeSimple>;

export interface ArrayType<T> {
  typ: T;
  size: number;
}
