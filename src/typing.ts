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

export type TotalType = GenType | SpecType;

interface TypeInfo {
  args: TotalType[];
  ret: TotalType;
}

interface BuiltIns {
  [key: string]: TypeInfo | TypeInfo[];
}

export class TinslError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
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

// helpers for type checking
export function isScalar(typ: TotalType) {
  return ["float", "int", "uint"].includes(typ);
}

function dimensionMismatch(op: string, left: TotalType, right: TotalType) {
  return new TinslError(`dimension mismatch: \
cannot do vector/matrix operation \`${left} ${op} ${right}\``);
}

/** checks if two types in an operation can be applied without type error */
export function scalarOp(
  op: string,
  left: TotalType,
  right: TotalType
): TotalType {
  if (isScalar(right) && !isScalar(left)) [left, right] = [right, left];
  if (
    (left === "float" && (/^vec/.test(right) || /^mat/.test(right))) ||
    (left === "int" && /^ivec/.test(right)) ||
    (left === "uint" && /^uvec/.test(right))
  ) {
    return right;
  }

  if (!isScalar(left) && !isScalar(right)) {
    throw dimensionMismatch(op, left, right);
  }

  throw new TinslError(`type mismatch: \
cannot do scalar operation \`${left} ${op} ${right}\``);
}

export function dimensions(typ: TotalType, side?: "left" | "right") {
  if (/^vec/.test(typ)) {
    const matches = typ.match(/^vec(.+)/);
    if (matches === null) throw new Error("no dimensions matches vec");
    if (side === undefined) throw new Error("side was undefined for vec");
    if (side === "left") {
      return ["1", matches[1]];
    }
    return [matches[1], "1"];
  }

  const matches = typ.match(/^mat(.+)/);
  if (matches === null) throw new Error("no dimensions matches mat");
  const dims = matches[1].split("x");
  if (dims.length === 1) return [dims[0], dims[0]];
  return dims.reverse();
}

// TODO make op specific type?
export function binaryTyping(
  op: string,
  left: TotalType,
  right: TotalType
): TotalType {
  if ("+-/*%".includes(op)) {
    if (op == "%") {
      const isIntBased = (typ: TotalType) =>
        ["int", "uint"].includes(typ) || /^[i|u]vec/.test(typ);
      if (!(isIntBased(left) && isIntBased(left))) {
        throw new TinslError(`operator \`%\` cannot be used on floating point scalars, \
vecs or matrices. use \`mod(x, y)\` instead`);
      }
    }

    if (left === right) return left;

    // matrix mult
    const matrixMultTypeMatch = (left: TotalType, right: TotalType) =>
      (/^vec/.test(left) && /^mat/.test(right)) ||
      (/^vec/.test(right) && /^mat/.test(left)) ||
      (/^mat/.test(right) && /^mat/.test(left));

    if (op === "*" && matrixMultTypeMatch(left, right)) {
      // mxn * nxp -> mxp
      // but in GLSL row and col are reversed from linear algebra
      const [m, n1] = dimensions(left, "left");
      const [n2, p] = dimensions(right, "right");
      if (n1 !== n2)
        throw new TinslError("matrix and/or vector dimension mismatch");
      if (m === "1" || p === "1")
        return `vec${Math.max(parseInt(m), parseInt(p))}` as TotalType;
      return `mat${p}x${m}` as TotalType;
    }

    return scalarOp(op, left, right);
  }

  throw new Error(`"${op}" not a valid symbol`);
}
// TODO page 61 conversions

// note: modf is skipped because it has an output parameter

// TODO check for valid l-value for dot application in assignment
// aka no `pos.xyx = something;`

// TODO length method for arrays
