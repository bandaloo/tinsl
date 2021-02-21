type GenType =
  | "genType"
  | "genBType"
  | "genIType"
  | "genUType"
  | "mat"
  | "vec"
  | "bvec"
  | "ivec"
  | "uvec";
// TODO export this and spread it in lexer to get rid of repeated info
type SpecType =
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
  | "mat4x4";

type TotalType = GenType | SpecType;

interface TypeInfo {
  args: TotalType[];
  ret: TotalType;
}

interface BuiltIns {
  [key: string]: TypeInfo | TypeInfo[];
}

// https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
// starting from p. 86
export const builtIns: BuiltIns = {
  // trig
  radians: { args: ["genType"], ret: "genType" },
  degrees: { args: ["genType"], ret: "genType" },
  sin: { args: ["genType"], ret: "genType" },
  cos: { args: ["genType"], ret: "genType" },
  tan: { args: ["genType"], ret: "genType" },
  asin: { args: ["genType"], ret: "genType" },
  acos: { args: ["genType"], ret: "genType" },
  atan: [
    { args: ["genType", "genType"], ret: "genType" },
    { args: ["genType"], ret: "genType" },
  ],
  sinh: { args: ["genType"], ret: "genType" },
  cosh: { args: ["genType"], ret: "genType" },
  tanh: { args: ["genType"], ret: "genType" },
  asinh: { args: ["genType"], ret: "genType" },
  acosh: { args: ["genType"], ret: "genType" },
  atanh: { args: ["genType"], ret: "genType" },

  // exponential
  pow: { args: ["genType", "genType"], ret: "genType" },
  exp: { args: ["genType"], ret: "genType" },
  log: { args: ["genType"], ret: "genType" },
  exp2: { args: ["genType"], ret: "genType" },
  log2: { args: ["genType"], ret: "genType" },
  sqrt: { args: ["genType"], ret: "genType" },
  inversesqrt: { args: ["genType"], ret: "genType" },

  // common
  abs: [
    { args: ["genType"], ret: "genType" },
    { args: ["genIType"], ret: "genIType" },
  ],
  sign: [
    { args: ["genType"], ret: "genType" },
    { args: ["genIType"], ret: "genIType" },
  ],
  floor: { args: ["genType"], ret: "genType" },
  trunc: { args: ["genType"], ret: "genType" },
  round: { args: ["genType"], ret: "genType" },
  roundEven: { args: ["genType"], ret: "genType" },
  ceil: { args: ["genType"], ret: "genType" },
  fract: { args: ["genType"], ret: "genType" },
  mod: [
    { args: ["genType", "float"], ret: "genType" },
    { args: ["genType", "genType"], ret: "genType" },
  ],
  min: [
    { args: ["genType", "genType"], ret: "genType" },
    { args: ["genType", "float"], ret: "genType" },
    { args: ["genIType", "genIType"], ret: "genIType" },
    { args: ["genIType", "int"], ret: "genIType" },
    { args: ["genUType", "genUType"], ret: "genUType" },
    { args: ["genUType", "uint"], ret: "genUType" },
  ],
  max: [
    { args: ["genType", "genType"], ret: "genType" },
    { args: ["genType", "float"], ret: "genType" },
    { args: ["genIType", "genIType"], ret: "genIType" },
    { args: ["genIType", "int"], ret: "genIType" },
    { args: ["genUType", "genUType"], ret: "genUType" },
    { args: ["genUType", "uint"], ret: "genUType" },
  ],
  clamp: [
    { args: ["genType", "genType", "genType"], ret: "genType" },
    { args: ["genType", "float", "float"], ret: "genType" },
    { args: ["genIType", "genIType", "genIType"], ret: "genIType" },
    { args: ["genIType", "int", "int"], ret: "genIType" },
    { args: ["genUType", "genUType", "genUType"], ret: "genUType" },
    { args: ["genUType", "uint", "uint"], ret: "genUType" },
  ],
  mix: [
    { args: ["genType", "genType", "genType"], ret: "genType" },
    { args: ["genType", "genType", "float"], ret: "genType" },
    { args: ["genType", "genType", "genBType"], ret: "genType" },
  ],
  step: [
    { args: ["genType", "genType"], ret: "genType" },
    { args: ["float", "genType"], ret: "genType" },
  ],
  smoothstep: [
    { args: ["genType", "genType", "genType"], ret: "genType" },
    { args: ["float", "float", "genType"], ret: "genType" },
  ],
  isnan: [{ args: ["genType"], ret: "genBType" }],
  isinf: [{ args: ["genType"], ret: "genBType" }],
  floatBitsToInt: [{ args: ["genType"], ret: "genIType" }],
  floatBitsToUint: [{ args: ["genType"], ret: "genUType" }],
  intBitsToFloat: [{ args: ["genIType"], ret: "genType" }],
  uintBitsToFloat: [{ args: ["genUType"], ret: "genType" }],

  // floating point pack/unpack
  packSnorm2x16: [{ args: ["vec2"], ret: "uint" }], // -> highp
  unpackSnorm2x16: [{ args: ["uint"], ret: "vec2" }], // highp -> highp
  packUnorm2x16: [{ args: ["vec2"], ret: "uint" }], // -> highp
  unpackUnorm2x16: [{ args: ["uint"], ret: "vec2" }], // highp -> highp
  packHalf2x16: [{ args: ["vec2"], ret: "uint" }], // mediump -> highp
  unpackHalf2x16: [{ args: ["uint"], ret: "vec2" }], // highp -> mediump

  // geometric
  length: { args: ["genType"], ret: "float" },
  distance: { args: ["genType", "genType"], ret: "float" },
  dot: { args: ["genType", "genType"], ret: "float" },
  cross: { args: ["vec3", "vec3"], ret: "vec3" },
  normalize: { args: ["genType"], ret: "genType" },
  faceforward: { args: ["genType", "genType", "genType"], ret: "genType" },
  reflect: { args: ["genType", "genType"], ret: "genType" },
  refract: { args: ["genType", "genType", "float"], ret: "genType" },

  // matrix
  matrixCompMult: { args: ["mat", "mat"], ret: "mat" },
  outerProduct: [
    { args: ["vec2", "vec2"], ret: "mat2" },
    { args: ["vec3", "vec3"], ret: "mat3" },
    { args: ["vec4", "vec4"], ret: "mat4" },

    { args: ["vec3", "vec2"], ret: "mat2x3" },
    { args: ["vec2", "vec3"], ret: "mat3x2" },

    { args: ["vec4", "vec2"], ret: "mat2x4" },
    { args: ["vec2", "vec4"], ret: "mat4x2" },

    { args: ["vec4", "vec3"], ret: "mat3x4" },
    { args: ["vec3", "vec4"], ret: "mat4x3" },
  ],
  transpose: [
    { args: ["mat2"], ret: "mat2" },
    { args: ["mat3"], ret: "mat3" },
    { args: ["mat4"], ret: "mat4" },

    { args: ["mat3x2"], ret: "mat2x3" },
    { args: ["mat2x3"], ret: "mat3x2" },

    { args: ["mat4x2"], ret: "mat2x4" },
    { args: ["mat2x4"], ret: "mat4x2" },

    { args: ["mat4x3"], ret: "mat3x4" },
    { args: ["mat3x4"], ret: "mat4x3" },
  ],
  determinant: [
    { args: ["mat2"], ret: "float" },
    { args: ["mat3"], ret: "float" },
    { args: ["mat4"], ret: "float" },
  ],
  inverse: [
    { args: ["mat2"], ret: "mat2" },
    { args: ["mat3"], ret: "mat3" },
    { args: ["mat4"], ret: "mat4" },
  ],

  // vector and relational
  lessThan: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
  ],
  lessThanEqual: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
  ],
  greaterThan: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
  ],
  greaterThanEqual: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
  ],
  equal: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
    { args: ["bvec", "bvec"], ret: "bvec" },
  ],
  notEqual: [
    { args: ["vec", "vec"], ret: "bvec" },
    { args: ["ivec", "ivec"], ret: "bvec" },
    { args: ["uvec", "uvec"], ret: "bvec" },
    { args: ["bvec", "bvec"], ret: "bvec" },
  ],
  any: [{ args: ["bvec"], ret: "bool" }],
  all: [{ args: ["bvec"], ret: "bool" }],
  not: [{ args: ["bvec"], ret: "bool" }],
};

// note: modf is skipped because it has an output parameter
