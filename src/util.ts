import { TinslError, TinslLineError } from "./err";

export function containsRepeats(str: string) {
  return /(.).*\1/.test(str);
}

function simplifyNearleyErrorMessage(msg: string) {
  return msg.substr(0, msg.lastIndexOf(" Instead"));
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
