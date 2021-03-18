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
  const line = +matches[1];
  const col = +matches[2];
  return new TinslLineError(simple.substr(index, simple.length), { line, col });
}

// TODO test this
export function hexColorToVector(str: string) {
  str = str.slice(1) + "ff"; // get rid of first char
  const vals = str.match(/..?/g); // split into groups of two
  if (vals === null) throw new Error("no match in color");
  const vec = vals.map((n) => parseInt(n, 16) / 255);
  if (vec.includes(NaN)) throw new Error("not a valid color");
  return vec;
}

export function toColorKey(str: string) {
  return str
    .toLowerCase()
    .split("")
    .filter((a) => a !== " " && a !== "\t")
    .join("");
}
