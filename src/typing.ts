import { TinslError } from "./err";
import { TotalType, TypeInfo } from "./typeinfo";
import {
  ArrayType,
  GenType,
  GenTypeSimple,
  SpecType,
  SpecTypeSimple,
} from "./typetypes";
import {
  extractMatrixDimensions,
  extractVecBase,
  extractVecLength,
  isScalar,
  matchingVecScalar,
} from "./typinghelpers";
import { strHasRepeats } from "./util";

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

// TODO should use specific type where total type is used some places

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
  typeInfo: TypeInfo | TypeInfo[] | undefined,
  funcName: string = "__foo" // default value to make tests more convenient
): SpecType {
  if (typeInfo === undefined) throw new Error("type info was undefined");
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
          `function "${funcName}" has a generic return type that was never matched in the arguments`
        );
      }
      return retSize === null
        ? retGenMapping
        : { typ: retGenMapping, size: retSize };
    }

    // return type is already specific type
    return info.ret as SpecType;
  }
  throw new TinslError(`no matching overload for function "${funcName}"`);
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
  if (typ === "__undecided") return "__undecided";
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
  if (left === "__undecided" || right === "__undecided") return "__undecided";

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
  if ([condType, ifType, elseType].includes("__undecided"))
    return "__undecided";

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

export function matrixAccessTyping(mat: SpecTypeSimple) {
  const [_, n] = extractMatrixDimensions(mat);
  return ("vec" + n) as SpecTypeSimple;
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

  if (comps.length > 4)
    throw new TinslError(
      "too many components; " +
        "cannot access greater than 4 components on a vector"
    );

  if (isScalar(vec))
    throw new TinslError(
      "cannot access components of a scalar. " +
        "can only access components of vector"
    );

  // TODO pull this out and do the check later
  /*
  if (leftHand && strHasRepeats(comps)) {
    throw new TinslError(
      "components for the left hand of an assignment cannot contain repeats"
    );
  }
  */

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
