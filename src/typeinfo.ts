import { GenType, SpecType, SpecTypeSimple } from "./typetypes";
import {
  extractMatrixDimensions,
  extractVecBase,
  extractVecLength,
  isMat,
  isVec,
  matchingVecScalar,
} from "./typinghelpers";

export type TotalType = GenType | SpecType;

export interface TypeInfo {
  params: TotalType[];
  ret: TotalType;
}

interface PrototypeDictionary {
  [key: string]: TypeInfo | TypeInfo[] | undefined;
}

const preserveScalarType = (typ: SpecType): TypeInfo[] => [
  { params: ["int"], ret: typ },
  { params: ["float"], ret: typ },
  { params: ["bool"], ret: typ },
  { params: ["uint"], ret: typ },
];

const rep = <T>(len: number, elem: T) => [...new Array(len)].map(() => elem);

function constructorInfo(typ: SpecTypeSimple): TypeInfo[] {
  if (isVec(typ)) {
    const base = extractVecBase(typ);
    const num = parseInt(extractVecLength(typ));
    const scalar = matchingVecScalar(typ);
    return [
      { params: rep(num, scalar), ret: typ },
      { params: rep(1, scalar), ret: typ },
      ...(num > 2
        ? [{ params: [base + (num - 1), scalar] as SpecType[], ret: typ }]
        : []),
    ];
  }

  if (isMat(typ)) {
    const [m, n] = extractMatrixDimensions(typ).map((num) => parseInt(num));
    const vec = "vec" + m;
    // note that it doesn't simplify matrix type name
    return [
      { params: ["float"], ret: typ },
      { params: rep(m * n, "float"), ret: typ },
      { params: rep(n, vec) as SpecType[], ret: typ },
    ];
  }

  throw new Error("not a vector or matrix");
}

export const constructors: PrototypeDictionary = {
  int: preserveScalarType("int"),
  bool: preserveScalarType("bool"),
  float: preserveScalarType("float"),
  uint: preserveScalarType("uint"),

  vec2: constructorInfo("vec2"),
  vec3: constructorInfo("vec3"),
  vec4: constructorInfo("vec4"),

  ivec2: constructorInfo("ivec2"),
  ivec3: constructorInfo("ivec3"),
  ivec4: constructorInfo("ivec4"),

  uvec2: constructorInfo("uvec2"),
  uvec3: constructorInfo("uvec3"),
  uvec4: constructorInfo("uvec4"),

  bvec2: constructorInfo("bvec2"),
  bvec3: constructorInfo("bvec3"),
  bvec4: constructorInfo("bvec4"),

  mat2: constructorInfo("mat2"),
  mat3: constructorInfo("mat3"),
  mat4: constructorInfo("mat4"),

  mat2x2: constructorInfo("mat2x2"),
  mat2x3: constructorInfo("mat2x3"),
  mat2x4: constructorInfo("mat2x4"),

  mat3x2: constructorInfo("mat3x2"),
  mat3x3: constructorInfo("mat3x3"),
  mat3x4: constructorInfo("mat3x4"),

  mat4x2: constructorInfo("mat4x2"),
  mat4x3: constructorInfo("mat4x3"),
  mat4x4: constructorInfo("mat4x4"),
};

// https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
// starting from p. 86
// note: modf is skipped because it has an output parameter
export const builtIns: PrototypeDictionary = {
  // trig
  radians: { params: ["genType"], ret: "genType" },
  degrees: { params: ["genType"], ret: "genType" },
  sin: { params: ["genType"], ret: "genType" },
  cos: { params: ["genType"], ret: "genType" },
  tan: { params: ["genType"], ret: "genType" },
  asin: { params: ["genType"], ret: "genType" },
  acos: { params: ["genType"], ret: "genType" },
  atan: [
    { params: ["genType", "genType"], ret: "genType" },
    { params: ["genType"], ret: "genType" },
  ],
  sinh: { params: ["genType"], ret: "genType" },
  cosh: { params: ["genType"], ret: "genType" },
  tanh: { params: ["genType"], ret: "genType" },
  asinh: { params: ["genType"], ret: "genType" },
  acosh: { params: ["genType"], ret: "genType" },
  atanh: { params: ["genType"], ret: "genType" },

  // exponential
  pow: { params: ["genType", "genType"], ret: "genType" },
  exp: { params: ["genType"], ret: "genType" },
  log: { params: ["genType"], ret: "genType" },
  exp2: { params: ["genType"], ret: "genType" },
  log2: { params: ["genType"], ret: "genType" },
  sqrt: { params: ["genType"], ret: "genType" },
  inversesqrt: { params: ["genType"], ret: "genType" },

  // common
  abs: [
    { params: ["genType"], ret: "genType" },
    { params: ["genIType"], ret: "genIType" },
  ],
  sign: [
    { params: ["genType"], ret: "genType" },
    { params: ["genIType"], ret: "genIType" },
  ],
  floor: { params: ["genType"], ret: "genType" },
  trunc: { params: ["genType"], ret: "genType" },
  round: { params: ["genType"], ret: "genType" },
  roundEven: { params: ["genType"], ret: "genType" },
  ceil: { params: ["genType"], ret: "genType" },
  fract: { params: ["genType"], ret: "genType" },
  mod: [
    { params: ["genType", "float"], ret: "genType" },
    { params: ["genType", "genType"], ret: "genType" },
  ],
  min: [
    { params: ["genType", "genType"], ret: "genType" },
    { params: ["genType", "float"], ret: "genType" },
    { params: ["genIType", "genIType"], ret: "genIType" },
    { params: ["genIType", "int"], ret: "genIType" },
    { params: ["genUType", "genUType"], ret: "genUType" },
    { params: ["genUType", "uint"], ret: "genUType" },
  ],
  max: [
    { params: ["genType", "genType"], ret: "genType" },
    { params: ["genType", "float"], ret: "genType" },
    { params: ["genIType", "genIType"], ret: "genIType" },
    { params: ["genIType", "int"], ret: "genIType" },
    { params: ["genUType", "genUType"], ret: "genUType" },
    { params: ["genUType", "uint"], ret: "genUType" },
  ],
  clamp: [
    { params: ["genType", "genType", "genType"], ret: "genType" },
    { params: ["genType", "float", "float"], ret: "genType" },
    { params: ["genIType", "genIType", "genIType"], ret: "genIType" },
    { params: ["genIType", "int", "int"], ret: "genIType" },
    { params: ["genUType", "genUType", "genUType"], ret: "genUType" },
    { params: ["genUType", "uint", "uint"], ret: "genUType" },
  ],
  mix: [
    { params: ["genType", "genType", "genType"], ret: "genType" },
    { params: ["genType", "genType", "float"], ret: "genType" },
    { params: ["genType", "genType", "genBType"], ret: "genType" },
  ],
  step: [
    { params: ["genType", "genType"], ret: "genType" },
    { params: ["float", "genType"], ret: "genType" },
  ],
  smoothstep: [
    { params: ["genType", "genType", "genType"], ret: "genType" },
    { params: ["float", "float", "genType"], ret: "genType" },
  ],
  isnan: [{ params: ["genType"], ret: "genBType" }],
  isinf: [{ params: ["genType"], ret: "genBType" }],
  floatBitsToInt: [{ params: ["genType"], ret: "genIType" }],
  floatBitsToUint: [{ params: ["genType"], ret: "genUType" }],
  intBitsToFloat: [{ params: ["genIType"], ret: "genType" }],
  uintBitsToFloat: [{ params: ["genUType"], ret: "genType" }],

  // floating point pack/unpack
  packSnorm2x16: [{ params: ["vec2"], ret: "uint" }], // -> highp
  unpackSnorm2x16: [{ params: ["uint"], ret: "vec2" }], // highp -> highp
  packUnorm2x16: [{ params: ["vec2"], ret: "uint" }], // -> highp
  unpackUnorm2x16: [{ params: ["uint"], ret: "vec2" }], // highp -> highp
  packHalf2x16: [{ params: ["vec2"], ret: "uint" }], // mediump -> highp
  unpackHalf2x16: [{ params: ["uint"], ret: "vec2" }], // highp -> mediump

  // geometric
  length: { params: ["genType"], ret: "float" },
  distance: { params: ["genType", "genType"], ret: "float" },
  dot: { params: ["genType", "genType"], ret: "float" },
  cross: { params: ["vec3", "vec3"], ret: "vec3" },
  normalize: { params: ["genType"], ret: "genType" },
  faceforward: { params: ["genType", "genType", "genType"], ret: "genType" },
  reflect: { params: ["genType", "genType"], ret: "genType" },
  refract: { params: ["genType", "genType", "float"], ret: "genType" },

  // matrix
  matrixCompMult: { params: ["mat", "mat"], ret: "mat" },
  outerProduct: [
    { params: ["vec2", "vec2"], ret: "mat2" },
    { params: ["vec3", "vec3"], ret: "mat3" },
    { params: ["vec4", "vec4"], ret: "mat4" },

    { params: ["vec3", "vec2"], ret: "mat2x3" },
    { params: ["vec2", "vec3"], ret: "mat3x2" },

    { params: ["vec4", "vec2"], ret: "mat2x4" },
    { params: ["vec2", "vec4"], ret: "mat4x2" },

    { params: ["vec4", "vec3"], ret: "mat3x4" },
    { params: ["vec3", "vec4"], ret: "mat4x3" },
  ],
  transpose: [
    { params: ["mat2"], ret: "mat2" },
    { params: ["mat3"], ret: "mat3" },
    { params: ["mat4"], ret: "mat4" },

    { params: ["mat3x2"], ret: "mat2x3" },
    { params: ["mat2x3"], ret: "mat3x2" },

    { params: ["mat4x2"], ret: "mat2x4" },
    { params: ["mat2x4"], ret: "mat4x2" },

    { params: ["mat4x3"], ret: "mat3x4" },
    { params: ["mat3x4"], ret: "mat4x3" },
  ],
  determinant: [
    { params: ["mat2"], ret: "float" },
    { params: ["mat3"], ret: "float" },
    { params: ["mat4"], ret: "float" },
  ],
  inverse: [
    { params: ["mat2"], ret: "mat2" },
    { params: ["mat3"], ret: "mat3" },
    { params: ["mat4"], ret: "mat4" },
  ],

  // vector and relational
  lessThan: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
  ],
  lessThanEqual: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
  ],
  greaterThan: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
  ],
  greaterThanEqual: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
  ],
  equal: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
    { params: ["bvec", "bvec"], ret: "bvec" },
  ],
  notEqual: [
    { params: ["vec", "vec"], ret: "bvec" },
    { params: ["ivec", "ivec"], ret: "bvec" },
    { params: ["uvec", "uvec"], ret: "bvec" },
    { params: ["bvec", "bvec"], ret: "bvec" },
  ],
  any: [{ params: ["bvec"], ret: "bool" }],
  all: [{ params: ["bvec"], ret: "bool" }],
  not: [{ params: ["bvec"], ret: "bool" }],
};
