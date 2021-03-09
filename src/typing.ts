import { TinslError, TinslLineError } from "./err";
import { containsRepeats } from "./util";

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
  | "mat4x4";

export type SpecType = SpecTypeSimple | ArrayType<SpecTypeSimple>;

export interface ArrayType<T> {
  typ: T;
  size: number;
}

export function compareTypes(left: SpecType, right: SpecType) {
  if (typeof left === "string" && typeof right === "string") {
    return left === right;
  }

  if (typeof left === "object" && typeof right === "object") {
    return left.typ === right.typ && left.size === right.size;
  }
  return false;
}

export function typeToString(typ: SpecType) {
  if (typeof typ === "string") return typ;
  return `${typ.typ}[${typ.size === 0 ? "" : typ.size}]`;
}

export type TotalType = GenType | SpecType;

interface TypeInfo {
  params: TotalType[];
  ret: TotalType;
}

interface PrototypeDictionary {
  [key: string]: TypeInfo | TypeInfo[];
}

// https://www.khronos.org/registry/OpenGL/specs/es/3.0/GLSL_ES_Specification_3.00.pdf
// starting from p. 86
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

const preserveScalarType = (typ: SpecType): TypeInfo[] => [
  { params: ["int"], ret: typ },
  { params: ["float"], ret: typ },
  { params: ["bool"], ret: typ },
  { params: ["uint"], ret: typ },
];

const rep = <T extends unknown>(len: number, elem: T) =>
  [...new Array(len)].map(() => elem);

export const isVec = (typ: SpecTypeSimple) => /^[i|u|b]?vec/.test(typ);

export const isMat = (typ: SpecTypeSimple) => /^mat/.test(typ);

function constructorInfo(typ: SpecTypeSimple): TypeInfo[] {
  if (isVec(typ)) {
    const base = extractVecBase(typ);
    const num = parseInt(extractVecLength(typ));
    const scalar = matchingVecScalar(typ);
    return [
      { params: rep(num, scalar), ret: typ },
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

// helpers for type checking
export function isScalar(typ: SpecTypeSimple) {
  return ["float", "int", "uint"].includes(typ);
}

// TODO should use specific type where total type is used some places

export function matchingVecScalar(vec: SpecTypeSimple): SpecType {
  return /^vec/.test(vec)
    ? "float"
    : /^ivec/.test(vec)
    ? "int"
    : /^uvec/.test(vec)
    ? "uint"
    : "bool";
}

function isIntBased(typ: SpecTypeSimple) {
  return ["int", "uint"].includes(typ) || /^[i|u]vec/.test(typ);
}

function dimensionMismatch(op: string, left: TotalType, right: TotalType) {
  return new TinslError(`dimension mismatch: \
cannot do vector/matrix operation \`${left} ${op} ${right}\``);
}

function toSimpleMatrix(m: SpecTypeSimple) {
  return (m === "mat2x2"
    ? "mat2"
    : m === "mat3x3"
    ? "mat3"
    : m === "mat4x4"
    ? "mat4"
    : m) as SpecTypeSimple;
}

function validGenSpecPair(gen: GenType, spec: SpecTypeSimple) {
  switch (gen) {
    case "genType":
      return spec === "float" || /^vec/.test(spec);
    case "genBType":
      return spec === "bool" || /^bvec/.test(spec);
    case "genIType":
      return spec === "int" || /^ivec/.test(spec);
    case "genUType":
      return spec === "uint" || /^uvec/.test(spec);
    case "mat":
      return /^mat/.test(spec);
    case "vec":
      return /^vec/.test(spec);
    case "bvec":
      return /^bvec/.test(spec);
    case "ivec":
      return /^ivec/.test(spec);
    case "uvec":
      return /^uvec/.test(spec);
    default:
      return false;
  }
}

const parseArrayType = <T extends string>(
  tempParam: T | ArrayType<T>
): [T, number | null] =>
  typeof tempParam === "object"
    ? [tempParam.typ, tempParam.size]
    : [tempParam, null];

export function callReturnType(
  args: SpecType[],
  typeInfo: TypeInfo | TypeInfo[]
): SpecType {
  const infoArr = Array.isArray(typeInfo) ? typeInfo : [typeInfo];

  for (const info of infoArr) {
    const genMap = callTypeCheck(args, info.params);

    // not a match, try again
    if (!genMap) continue;

    // return type is already specific type
    // decide the return type, which could be generic
    const [ret, retSize] = parseArrayType(info.ret);
    const retGenMapping = genMap.get(ret as any);
    if (retGenMapping !== undefined) {
      // if return type is generic and there is no match, invalid function
      if (retGenMapping === null) {
        throw new TinslError(
          "function has a generic return type that was never matched in the arguments"
        );
      }
      return retSize === null
        ? retGenMapping
        : { typ: retGenMapping, size: retSize };
    }
    return info.ret as SpecType;
  }
  throw new TinslError("no matching overload for function");

  // return type is already specific type
}

type GenMap = Map<GenTypeSimple, SpecTypeSimple | null>;

export function callTypeCheck(
  args: SpecType[],
  params: TotalType[]
): null | GenMap {
  const genArr: GenTypeSimple[] = [
    "genType",
    "genBType",
    "genIType",
    "genUType",
    "mat",
    "vec",
    "bvec",
    "ivec",
    "uvec",
  ];

  const genMap: GenMap = new Map<GenTypeSimple, SpecTypeSimple | null>();

  // clear the map
  for (const g of genArr) {
    genMap.set(g, null);
  }

  // num of params and num of args don't match, so move on
  if (params.length !== args.length) return null;
  for (let i = 0; i < args.length; i++) {
    const [arg, argSize] = parseArrayType(args[i]);
    const [param, paramSize] = parseArrayType(params[i]);

    // if one type is an array and the other is not, or arrays are not same
    // size, move on
    if (argSize !== paramSize) {
      return null;
    }

    const argGenMapping = genMap.get(param as any);
    if (argGenMapping !== undefined) {
      // if it is null, this generic type already has a mapping
      // all future arguments must be of the same type
      if (argGenMapping !== null && argGenMapping !== arg) {
        return null;
      } else {
        // now we know the param is a generic type
        const genParam = param as GenTypeSimple;
        if (!validGenSpecPair(genParam, arg)) {
          return null;
        }
        genMap.set(genParam, arg);
      }
    } else {
      // now we know the param is a specific type
      if (param !== arg) {
        return null;
      }
    }
  }

  return genMap;
}

/** checks if two types in an operation can be applied without type error */
export function scalarOp(
  op: string,
  left: SpecTypeSimple,
  right: SpecTypeSimple
): SpecType {
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

export function extractVecBase(typ: string) {
  const matches = typ.match(/^([i|u|b]?vec)/);
  if (matches === null) throw new Error("could not match base of vec");
  return matches[1];
}

export function extractVecLength(typ: string) {
  const matches = typ.match(/^[i|u|b]?vec(.+)/); // TODO test bvec (was missing)
  if (matches === null) throw new Error("could not match size of vec");
  return matches[1];
}

export function extractMatrixDimensions(typ: string) {
  const matches = typ.match(/^mat(.+)/);
  if (matches === null) throw new Error("no dimensions matches mat");
  const dims = matches[1].split("x");
  if (dims.length === 1) return [dims[0], dims[0]];
  return dims;
}

export function dimensions(typ: SpecTypeSimple, side?: "left" | "right") {
  if (/^vec/.test(typ)) {
    const size = extractVecLength(typ);
    if (side === undefined) throw new Error("side was undefined for vec");
    if (side === "left") {
      return ["1", size];
    }
    return [size, "1"];
  }

  return extractMatrixDimensions(typ).reverse();
}

export function unaryTyping(op: string, typ: SpecType): SpecType {
  if (typeof typ === "object")
    throw new TinslError("cannot perform unary operation on an array");
  typ = toSimpleMatrix(typ);
  if (["+", "-", "++", "--"].includes(op)) {
    // TODO we'll have to check if ++, -- value is valid l-value
    if (typ === "bool" || /^bvec/.test(typ)) {
      throw new TinslError(`unary operator ${op} can only be used on \
boolean scalars`);
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
  left: SpecType,
  right: SpecType
): SpecType {
  if (typeof left === "object" || typeof right === "object")
    throw new TinslError("cannot perform binary operation on array types");
  [left, right] = [left, right].map(toSimpleMatrix);

  if ("+-/*%&|^".includes(op)) {
    if ("%&|^".includes(op)) {
      if (!(isIntBased(left) && isIntBased(right))) {
        throw new TinslError(`${
          op === "%" ? "mod" : "bitwise"
        } operator ${op} cannot be used on \
floating point scalars, vectors or matrices${
          op === "%" ? ". use mod(x, y) instead" : ""
        }`);
      }
    }

    if (left === right) return left;

    // matrix mult
    const matrixMultTypeMatch = (left: SpecTypeSimple, right: SpecTypeSimple) =>
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
        return `vec${Math.max(parseInt(m), parseInt(p))}` as SpecType;
      return `mat${p === m ? m : p + "x" + m}` as SpecType;
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

    return "bool";
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
  condType: SpecType,
  ifType: SpecType,
  elseType: SpecType
): SpecType {
  if (typeof condType === "object") {
    throw new TinslError(
      "cannot have array type as condition in ternary expression"
    );
  }

  if (typeof ifType === "object" || typeof elseType === "object") {
    throw new TinslError(
      "cannot have ternary expression evaluate to an array type"
    );
  }

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

export function vectorAccessTyping(
  comps: string,
  vec: SpecType,
  leftHand: boolean
) {
  // TODO .length property of array
  if (typeof vec === "object")
    throw new TinslError(
      "cannot access properties of an array with . operator (use [])"
    );

  if (comps.length > 4) {
    throw new TinslError(
      "too many components; " +
        "cannot access greater than 4 components on a vector"
    );
  }

  if (isScalar(vec))
    throw new TinslError(
      "cannot access components of a scalar. " +
        "can only access components of vector"
    );

  if (leftHand && containsRepeats(comps)) {
    throw new TinslError(
      "components for the left hand of an assignment cannot contain repeats"
    );
  }

  const base = extractVecBase(vec);
  const len = parseInt(extractVecLength(vec));
  const sets = ["rgba", "xyzw", "stpq"];
  const domains = sets.join("");
  let prevSet: number | undefined = undefined;

  for (const c of comps) {
    const trueIndex = domains.lastIndexOf(c);
    const index = trueIndex % 4;
    if (index !== -1) {
      if (index > len - 1)
        throw new TinslError(
          `component ${c} cannot be used \
on a vector of length ${len}`
        );
      const set = Math.floor(trueIndex / 4);
      if (prevSet !== undefined && prevSet !== set) {
        throw new TinslError(
          `mixed sets (${sets.join(", ")}) in components ${comps}`
        );
      }
      prevSet = set;
    } else {
      throw new TinslError(
        `component ${c} does not belong in any set ${sets.join(", ")}`
      );
    }
  }

  if (comps.length === 1) return matchingVecScalar(vec);
  return (base + comps.length) as SpecType;
}
// note: modf is skipped because it has an output parameter

// TODO check for valid l-value for dot application in assignment
// aka no `pos.xyx = something;`

// TODO length method for arrays
// TODO does the grammar allow return statements inside procedures?
