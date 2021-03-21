import { SpecType, SpecTypeSimple } from "./typetypes";

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

export function isInIndexableRange(typ: SpecType, index: number) {
  if (typeof typ === "object") {
    return index >= 0 && index < typ.size;
  }

  if (isVec(typ)) {
    const len = parseInt(extractVecLength(typ));
    return index >= 0 && index < len;
  }

  if (isMat(typ)) {
    const dim = parseInt(extractMatrixDimensions(typ)[0]);
    return index >= 0 && index < dim;
  }

  throw new Error("not an indexable type");
}

export function matchingVecScalar(vec: SpecTypeSimple): SpecType {
  return /^vec/.test(vec)
    ? "float"
    : /^ivec/.test(vec)
    ? "int"
    : /^uvec/.test(vec)
    ? "uint"
    : "bool";
}

export const isVec = (typ: SpecTypeSimple) => /^[i|u|b]?vec/.test(typ);

export const isMat = (typ: SpecTypeSimple) => /^mat/.test(typ);

// helpers for type checking
export function isScalar(typ: SpecTypeSimple) {
  return ["float", "int", "uint"].includes(typ);
}
