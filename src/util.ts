export function containsRepeats(str: string) {
  return /(.).*\1/.test(str);
}
