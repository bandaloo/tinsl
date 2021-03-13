import { Token } from "moo";
import { Expr, ExSt, LexicalScope, Stmt } from "./nodes";
import { SpecType } from "./typing";

export class TinslError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TinslLineError extends Error {
  line: number;
  col: number;

  constructor(message: string, tokn: Token | { line: number; col: number }) {
    super(message);
    this.line = tokn.line;
    this.col = tokn.col;
    this.message = `at line ${tokn.line} column ${tokn.col}: ` + message;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TinslAggregateError extends Error {
  errors: TinslLineError[];

  constructor(errors: TinslLineError[]) {
    super(errors.map((e) => e.message).join("\n"));
    this.errors = errors;
  }
}

export function wrapErrorHelper<T>(
  callback: (scope: LexicalScope) => T,
  exSt: ExSt,
  scope: LexicalScope
): T {
  try {
    return callback(scope);
  } catch (e: unknown) {
    if (e instanceof TinslError)
      throw new TinslLineError(e.message, exSt.getToken());
    throw e;
  }
}
