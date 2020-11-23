import type { Token } from "moo";

export const test = "test!";

// TODO stricter types for operator string

function commaSeparatedExprs(exprs: Expr[]) {
  return exprs.map((s) => s.parse()).join();
}

abstract class Node {
  abstract parse(): string;
  abstract toJson(): object;
  toString() {
    return JSON.stringify(this.toJson());
  }
}

abstract class Expr extends Node {
  abstract getSubExpressions(): Expr[];
  abstract getToken(): Token;
}

class BinaryExpr extends Expr {
  operator: Token;
  left: Expr;
  right: Expr;

  constructor(operator: Token, left: Expr, right: Expr) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  getSubExpressions() {
    return [this.left, this.right];
  }

  getToken() {
    return this.operator;
  }

  toJson() {
    return {
      name: "binary_expr",
      operator: this.operator,
      left: this.left.toJson(),
      right: this.right.toJson(),
    };
  }

  parse() {
    return `(${this.left.parse()}${this.operator.text}${this.right.parse()})`;
  }
}

class UnaryExpr extends Expr {
  operator: Token;
  argument: Expr;

  constructor(operator: Token, argument: Expr) {
    super();
    this.operator = operator;
    this.argument = argument;
  }

  getSubExpressions() {
    return [this.argument];
  }

  getToken() {
    return this.operator;
  }

  parse() {
    return `(${this.operator}${this.argument.parse()})`;
  }

  toJson() {
    return {
      name: "unary_expr",
      operator: this.operator,
      argument: this.argument.toJson(),
    };
  }
}

abstract class NumExpr extends Expr {
  value: Token;

  constructor(value: Token) {
    super();
    this.value = value;
  }

  getSubExpressions() {
    return [];
  }

  getToken() {
    return this.value;
  }

  parse() {
    return this.value.text;
  }
}

class FloatExpr extends NumExpr {
  toJson() {
    return {
      name: "float_expr",
      value: this.value.text,
    };
  }
}

class IntExpr extends NumExpr {
  toJson() {
    return {
      name: "int_expr",
      value: this.value.text,
    };
  }
}

abstract class CallExpression extends Expr {
  call: Token;
  args: Expr[];

  constructor(call: Token, args: Expr[]) {
    super();
    this.call = call;
    this.args = args;
  }

  getSubExpressions(): Expr[] {
    return this.args;
  }

  getToken(): Token {
    return this.call;
  }

  parse(): string {
    return `${this.call.text}(${commaSeparatedExprs(this.args)})`;
  }
}

class VecExpr extends CallExpression {
  toJson(): object {
    return { name: "vec_expr", call: this.call, args: this.args };
  }
}

class MatExpr extends CallExpression {
  toJson(): object {
    return { name: "mat_expr", call: this.call, args: this.args };
  }
}

class FuncCallExpr extends CallExpression {
  toJson(): object {
    return { name: "func_call_expr", call: this.call, args: this.args };
  }
}

/*
export type Expr =
  | BinaryExpr
  | UnaryExpr
  | FloatExpr
  | IntExpr
  | VecExpr
  | FuncCallExpr;

export interface Type {
  id: "type";
  type: Token | null;
}

export interface BinaryExpr {
  id: "binaryexpr";
  operator: Token;
  left: Expr;
  right: Expr;
}

export interface UnaryExpr {
  id: "unaryexpr";
  operator: Token;
  argument: Expr;
}

export interface FloatExpr {
  id: "floatexpr";
  value: Token;
}

export interface IntExpr {
  id: "intexpr";
  value: Token;
}

export interface VecExpr {
  id: "vecexpr";
  call: Token;
}

export interface FuncDecl {
  id: "funcdecl";
  identifier: Token;
  returnType: Type;
  paramTypes: Type[];
  paramIdents: Token[];
  body: Expr[];
}

export interface FuncCallExpr {
  id: "funccallexpr";
  identifier: Token;
  arguments: Expr[];
}

export interface ProcDecl {
  id: "procdecl";
  identifier: Token;
  paramTypes: Type[];
  paramIdents: Token[];
  body: Expr[];
}

export interface ProcCall {
  id: "proccall";
  identifier: Token;
  arguments: Expr[];
}

export interface RenderBlock {
  id: "renderop";
  inChannel: Token | null;
  outChannel: Token;
  operations: (Expr | ProcCall)[];
}

export interface Program {
  body: (ProcDecl | FuncDecl | RenderBlock)[];
}
*/

/*
export function makeBinaryExpr(
  operator: Token,
  left: Expr,
  right: Expr
): BinaryExpr {
  return { id: "binaryexpr", operator, left, right };
}

export function makeUnaryExpr(operator: Token, argument: Expr): UnaryExpr {
  return { id: "unaryexpr", operator, argument };
}
*/

export type { Node };
