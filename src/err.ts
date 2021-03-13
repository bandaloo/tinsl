import { Token } from "moo";
import { ExSt, LexicalScope, typeCheckExprStmts } from "./nodes";
import { callTypeCheck } from "./typing";

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
    super(
      `tinsl: ${errors.length} error${errors.length > 1 ? "s" : ""} found:\n` +
        errors.map((e) => e.message).join("\n")
    );
    this.errors = errors;
  }
}

export function wrapErrorHelper<T>(
  callback: (scope: LexicalScope) => T,
  exSt: ExSt,
  scope: LexicalScope,
  renderLevel = false,
  extraExSts: ExSt[] = [],
  innerScope = scope
): T {
  let lineErr: TinslLineError | undefined = undefined;
  let ret: T | null = null;
  try {
    ret = callback(scope);
  } catch (err) {
    if (!(err instanceof TinslError)) throw err;
    lineErr = new TinslLineError(err.message, exSt.getToken());
  }

  let aggregateErr: TinslAggregateError | undefined = undefined;
  try {
    typeCheckExprStmts(extraExSts, innerScope, renderLevel);
  } catch (err) {
    if (!(err instanceof TinslAggregateError)) throw err;
    aggregateErr = err;
  }

  const totalErrors = [
    ...(lineErr !== undefined ? [lineErr] : []),
    ...(aggregateErr !== undefined ? aggregateErr.errors : []),
  ];

  if (totalErrors.length > 0) throw new TinslAggregateError(totalErrors);

  if (ret === null)
    throw new Error("ret was null and no throw happened before");

  return ret;
}
