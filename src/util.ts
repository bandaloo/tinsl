import { TinslError, TinslLineError } from "./err";

export function strHasRepeats(str: string) {
  return /(.).*\1/.test(str);
}

export function arrHasRepeats<T>(arr: T[]) {
  return new Set(arr).size !== arr.length;
}

function simplifyNearleyErrorMessage(msg: string) {
  return msg.substr(0, msg.lastIndexOf(" Instead"));
}

export function increasesByOneFromZero(arr: number[]) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== i) return false;
  }
  return true;
}

export function tinslNearleyError(e: Error) {
  const simple = simplifyNearleyErrorMessage(e.message);
  const matches = simple.match(/line ([0-9]+) col ([0-9]+)/);
  const index = simple.indexOf("\n\n");
  if (matches === null) throw new Error("no matches in nearley error");
  const line = parseInt(matches[1]);
  const col = parseInt(matches[2]);
  return new TinslLineError(simple.substr(index, simple.length), { line, col });
}

export function hexColorToVector(str: string) {
  if (str[0] !== "#") return;
  str = str.slice(1); // get rid of the # at the beginning
  if (![3, 4, 6, 8].includes(str.length)) {
    throw new TinslError("invalid length for hex color");
  }
  const num = str.length === 3 || str.length === 4 ? 1 : 2;
  const vals = num === 2 ? str.match(/../g) : str.match(/./g);
  if (vals === null) throw new Error("no match in color");
  const vec = vals.map((n) => parseInt(n, 16) / (num === 1 ? 7 : 255));
  if (vec.includes(NaN)) throw new TinslError("not a valid color");
  return vec;
}

export function toColorKey(str: string) {
  return str
    .toLowerCase()
    .split("")
    .filter((a) => a !== " " && a !== "\t")
    .join("");
}

export const arrayPad = <T, U>(arr: T[], len: number, elem: U): (T | U)[] =>
  arr.concat(new Array(len - arr.length).fill(elem));

// TODO make this an invalid ident
export const NON_CONST_ID = "non_const_identity";
