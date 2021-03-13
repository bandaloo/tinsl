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
  extraExSts: ExSt[] = []
): T {
  let aggregateErr: TinslAggregateError | undefined = undefined;
  try {
    typeCheckExprStmts(extraExSts, scope, renderLevel);
  } catch (err) {
    if (!(err instanceof TinslAggregateError)) {
      throw err;
    }
    aggregateErr = err;
  }
  let lineErr: TinslLineError | undefined = undefined;
  try {
    return callback(scope);
  } catch (e) {
    if (!(e instanceof TinslError)) throw e;
    lineErr = new TinslLineError(e.message, exSt.getToken());
  }

  const totalErrors = [
    ...(lineErr !== undefined ? [lineErr] : []),
    ...(aggregateErr !== undefined ? aggregateErr.errors : []),
  ];

  throw new TinslAggregateError(totalErrors);
}
