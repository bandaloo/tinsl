import type { Token } from "moo";

// TODO stricter types for operator string
// TODO do we want a list of tokens for each node?

function commaSeparatedExprs(exprs: Expr[]) {
  return exprs.map((s) => s.parse()).join();
}

abstract class Node {
  abstract toJson(): object;
  abstract parse(): string;
  toString() {
    return JSON.stringify(this.toJson());
  }
}

abstract class Expr extends Node {
  abstract getSubExpressions(): Expr[];
  abstract getToken(): Token; // TODO change this to tokens?
}

// TODO token for renderblock
export class RenderBlock extends Node {
  once: boolean;
  inNum: number | null;
  outNum: number | null;
  loopNum: number | null;
  expressions: Expr[];

  constructor(
    once: boolean,
    expressions: Expr[],
    inNum: number | null,
    outNum: number | null,
    loopNum: number | null
  ) {
    super();
    this.once = once;
    this.expressions = expressions;
    this.inNum = inNum;
    this.outNum = outNum;
    this.loopNum = loopNum;
  }

  toJson(): object {
    const info: string[] = [];
    if (this.inNum !== null) {
      info.push("" + this.inNum);
      info.push("->");
    }
    if (this.loopNum !== null) {
      info.push("loop");
      info.push("" + this.loopNum);
    }
    if (this.once) {
      info.push("once");
    }
    info.push(`{${this.expressions.length} ops}`);
    if (this.outNum !== null) {
      info.push("->");
      info.push("" + this.loopNum);
    }
    return {
      name: "render_block",
      info: info.join(" "),
    };
  }

  parse(): string {
    return this.expressions.map((e) => e.parse()).join("");
  }
}

export class BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {
    super();
    this.left = left;
    this.operator = operator;
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
      left: this.left.toJson(),
      operator: this.operator,
      right: this.right.toJson(),
    };
  }

  parse() {
    return `(${this.left.parse()}${this.operator.text}${this.right.parse()})`;
  }
}

export class UnaryExpr extends Expr {
  operator: Token;
  argument: Expr;
  postfix: boolean;

  constructor(operator: Token, argument: Expr, postfix = false) {
    super();
    this.operator = operator;
    this.argument = argument;
    this.postfix = false;
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

export abstract class AtomExpr extends Expr {
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

  protected jsonHelper(name: string) {
    return { name: name, value: this.value.text };
  }
}

export class FloatExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("float_expr");
  }
}

export class IntExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("int_expr");
  }
}

export class IdentExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("ident_expr");
  }
}

export class BoolExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("bool_expr");
  }
}

export class CallExpr extends Expr {
  open: Token;
  call: Expr;
  args: Expr[];

  constructor(open: Token, call: Expr, args: Expr[]) {
    super();
    this.open = open;
    this.call = call;
    this.args = args;
  }

  getSubExpressions(): Expr[] {
    return this.args;
  }

  getToken(): Token {
    return this.open;
  }

  parse(): string {
    return `${this.call.parse}(${commaSeparatedExprs(this.args)})`;
  }

  toJson(): object {
    return { name: "call_expr", call: this.open, args: this.args };
  }
}

export class SubscriptExpr extends Expr {
  open: Token;
  call: Expr;
  index: Expr;

  constructor(open: Token, call: Expr, index: Expr) {
    super();
    this.open = open;
    this.call = call;
    this.index = index;
  }

  getSubExpressions(): Expr[] {
    return [this.index];
  }

  getToken(): Token {
    return this.open;
  }

  parse(): string {
    return `${this.call.parse}[${this.index.parse()}]`;
  }

  toJson(): object {
    return { name: "subscript_expr", call: this.call, index: this.index };
  }
}

export class Decl extends Node {
  constant: boolean;
  type: Token;
  id: Token;
  expr: Expr;

  constructor(constant: boolean, type: Token, id: Token, expr: Expr) {
    super();
    this.constant = constant;
    this.type = type;
    this.id = id;
    this.expr = expr;
  }

  toJson(): object {
    return {
      name: "decl",
      type: this.type,
      id: this.id,
      expr: this.expr,
    };
  }

  parse(): string {
    return `${this.constant ? "const " : ""}${this.type.text}${this.id.text}=${
      this.expr.parse
    };`;
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

export type { Node, Expr };
