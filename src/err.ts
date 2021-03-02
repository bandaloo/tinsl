import { Token } from "moo";
import { SpecType } from "./typing";

export class TinslError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class TinslLineError extends Error {
  line: number | undefined;
  col: number | undefined;

  constructor(message: string, tokn: Token | { line: number; col: number }) {
    super(message);
    this.line = tokn.line;
    this.col = tokn.col;
    this.message = `at line ${tokn.line} column ${tokn.col}: ` + message;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function wrapTypeError(callback: () => SpecType, tokn: Token): SpecType {
  try {
    return callback();
  } catch (e: unknown) {
    if (e instanceof TinslError) throw new TinslLineError(e.message, tokn);
    throw e;
  }
}
