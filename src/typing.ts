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

function isIntBased(typ: TotalType) {
  return ["int", "uint"].includes(typ) || /^[i|u]vec/.test(typ);
}

function dimensionMismatch(op: string, left: TotalType, right: TotalType) {
  return new TinslError(`dimension mismatch: \
cannot do vector/matrix operation \`${left} ${op} ${right}\``);
}

function toSimpleMatrix(m: string) {
  return (m === "mat2x2"
    ? "mat2"
    : m === "mat3x3"
    ? "mat3"
    : m === "mat4x4"
    ? "mat4"
    : m) as TotalType;
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

function extractVecLength(typ: string) {
  const matches = typ.match(/^[i|u]?vec(.+)/);
  if (matches === null) throw new Error("could not match size of vec");
  return matches[1];
}

export function dimensions(typ: TotalType, side?: "left" | "right") {
  if (/^vec/.test(typ)) {
    const size = extractVecLength(typ);
    if (side === undefined) throw new Error("side was undefined for vec");
    if (side === "left") {
      return ["1", size];
    }
    return [size, "1"];
  }

  const matches = typ.match(/^mat(.+)/);
  if (matches === null) throw new Error("no dimensions matches mat");
  const dims = matches[1].split("x");
  if (dims.length === 1) return [dims[0], dims[0]];
  return dims.reverse();
}

export function unaryTyping(op: string, typ: TotalType): TotalType {
  typ = toSimpleMatrix(typ);
  if (["+", "-", "++", "--"].includes(op)) {
    // TODO we'll have to check if ++, -- value is valid l-value
    if (typ === "bool" || /^bvec/.test(typ)) {
      throw new TinslError(`unary operator ${op} cannot be used on \
boolean scalars or vectors`);
    }
    return typ;
  }

  if (op === "~") {
    if (!isIntBased(typ)) {
      throw new TinslError(`unary operator ${op} cannot be used on \
floating point scalars, vectors or matrices`);
    }
    return typ;
  }

  if (op === "!") {
    if (typ !== "bool") {
      throw new TinslError(`unary operator ${op} can only be used on \
scalar booleans. for boolean vectors, use not(val)`);
    }
    return typ;
  }

  throw new Error(`"${op}" not a valid unary operator`);
}

// TODO consider what to do with mat2x2 being the same as mat2
// TODO make op specific type?
export function binaryTyping(
  op: string,
  left: TotalType,
  right: TotalType
): TotalType {
  [left, right] = [left, right].map(toSimpleMatrix);

  if ("+-/*%&|^".includes(op)) {
    if ("%&|^".includes(op)) {
      if (!(isIntBased(left) && isIntBased(left))) {
        throw new TinslError(`binary operator ${op} cannot be used on \
floating point scalars, vectors or matrices${
          op === "%" ? ". use mod(x, y) instead" : ""
        }`);
      }
    }

    if (left === right) return left;

    // matrix mult
    const matrixMultTypeMatch = (left: TotalType, right: TotalType) =>
      (/^vec/.test(left) && /^mat/.test(right)) ||
      (/^mat/.test(left) && /^vec/.test(right)) ||
      (/^mat/.test(left) && /^mat/.test(right));

    if (op === "*" && matrixMultTypeMatch(left, right)) {
      // mxn * nxp -> mxp
      // but in GLSL row and col are reversed from linear algebra
      const [m, n1] = dimensions(left, "left");
      const [n2, p] = dimensions(right, "right");
      if (n1 !== n2)
        throw new TinslError("matrix and/or vector dimension mismatch");
      if (m === "1" || p === "1")
        return `vec${Math.max(parseInt(m), parseInt(p))}` as TotalType;
      return `mat${p === m ? m : p + "x" + m}` as TotalType;
    }

    return scalarOp(op, left, right);
  }

  if ([">", "<", ">=", "<="].includes(op)) {
    if (left !== right) {
      throw new TinslError(
        `${op} relation operator can only compare values of the same type`
      );
    }

    if (!(isScalar(left) && isScalar(right))) {
      throw new TinslError(`${op} relational operator can only be used to \
compare scalars. for vectors, use ${
        op === ">"
          ? "greaterThan"
          : op === "<"
          ? "lessThan"
          : op === ">="
          ? "greaterThanEqual"
          : "lessThanEqual"
      }(left, right) instead.`);
    }

    return left;
  }

  if (["==", "!="].includes(op)) {
    if (left !== right) {
      throw new TinslError(
        `${op} equality operator can only compare expressions of the same type`
      );
    }

    return "bool";
  }

  if (["&&", "||", "^^"].includes(op)) {
    if (!(left === "bool" && right === "bool")) {
      throw new TinslError(
        `${op} logical operator can only operate on booleans`
      );
    }

    return left;
  }

  if ([">>", "<<"].includes(op)) {
    // "For both operators, the operands must be signed or unsigned integers or
    // integer vectors. One operand can be signed while the other is unsigned."
    if (!isIntBased(left) || !isIntBased(right)) {
      throw new TinslError(`${op} bitshift operator can only operate on \
signed or unsigned integers or vectors`);
    }

    // "If the first operand is a scalar, the second operand has to be a scalar
    // as well."
    if (isScalar(left) && !isScalar(right)) {
      throw new TinslError(`expression to right of ${op} bitshift operator \
must be a scalar if expression to left is also a scalar`);
    }

    // "If the first operand is a vector, the second operand must be a scalar or
    // a vector with the same size as the first operand [...]."
    if (
      !isScalar(left) &&
      !(isScalar(right) || extractVecLength(left) === extractVecLength(right))
    ) {
      throw new TinslError(`expression to right of ${op} bitshift operator \
must be a scalar or same-length vector if the expression to left is a vector`);
    }

    // "In all cases, the resulting type will be the same type as the left
    // operand."
    return left;
  }

  throw new Error(`${op} not a valid binary operator`);
}

export function ternaryTyping(
  condType: TotalType,
  ifType: TotalType,
  elseType: TotalType
): TotalType {
  [ifType, elseType] = [ifType, elseType].map(toSimpleMatrix);

  if (condType !== "bool") {
    throw new TinslError(`the condition expression in a ternary expression \
must be of boolean type`);
  }

  if (ifType !== elseType) {
    throw new TinslError(`both ending expressions in a ternary expression \
must have the same type`);
  }

  return ifType;
}
// TODO page 61 conversions

// note: modf is skipped because it has an output parameter

// TODO check for valid l-value for dot application in assignment
// aka no `pos.xyx = something;`

// TODO length method for arrays
