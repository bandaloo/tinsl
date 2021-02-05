import type { Token } from "moo";
import { stringify } from "querystring"; // TODO what was this for

// TODO stricter types for operator string
// TODO do we want a list of tokens for each node?

// TODO check the json conversion functions for tokens

function commaSeparatedNodes(exprs: Node[]) {
  return exprs.map((s) => s.parse()).join();
}

function lineSeparatedNodes(exprs: Node[]) {
  return "\n" + exprs.map((s) => s.parse()).join(";\n");
}

abstract class Node {
  abstract toJson(): object;
  abstract parse(): string;
  abstract getToken(): Token; // TODO change this to tokens?
  toString() {
    return JSON.stringify(this.toJson());
  }
}

abstract class Expr extends Node {
  abstract getSubExpressions(): Expr[];
  // TODO move this up to Node class?
}

// TODO token for renderblock
export class RenderBlock extends Node {
  once: boolean;
  inNum: number | null;
  outNum: number;
  loopNum: number | null;
  expressions: Expr[]; // TODO rename to body?
  open: Token;

  constructor(
    once: boolean,
    expressions: Expr[],
    inNum: number | null,
    outNum: number,
    loopNum: number | null,
    open: Token
  ) {
    super();
    this.once = once;
    this.expressions = expressions;
    this.inNum = inNum;
    this.outNum = outNum;
    this.loopNum = loopNum;
    this.open = open;
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
    // TODO this isn't complete
    return this.expressions.map((e) => e.parse()).join("");
  }

  getToken(): Token {
    return this.open;
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
    return `${this.call.parse}(${commaSeparatedNodes(this.args)})`;
  }

  toJson(): object {
    return { name: "call_expr", call: this.call.parse(), args: this.args };
  }
}

export class ConstructorExpr extends Expr {
  open: Token;
  type: TypeName;
  args: Expr[];

  constructor(open: Token, type: TypeName, args: Expr[]) {
    super();
    this.open = open;
    this.type = type;
    this.args = args;
  }

  getSubExpressions(): Expr[] {
    return this.args;
  }

  getToken(): Token {
    return this.open;
  }

  parse(): string {
    return `${this.type.parse()}(${commaSeparatedNodes(this.args)})`;
  }

  toJson(): object {
    return {
      name: "constructor_expr",
      type: this.type.parse(),
      args: this.args,
    };
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

export class Decl extends Expr {
  constant: boolean;
  type: TypeName;
  id: Token;
  expr: Expr;
  assign: Token;

  constructor(
    constant: boolean,
    type: TypeName,
    id: Token,
    expr: Expr,
    assign: Token
  ) {
    super();
    this.constant = constant;
    this.type = type;
    this.id = id;
    this.expr = expr;
    this.assign = assign;
  }

  getSubExpressions(): Expr[] {
    return [this.expr];
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
    return `${this.constant ? "const " : ""}${this.type.parse()}${
      this.id.text
    }=${this.expr.parse}`;
  }

  getToken(): Token {
    return this.assign;
  }
}

// we will reject invalid left-hand assignments not in the grammar but in a
// second pass; this will lead to better error messages
export class Assign extends Expr {
  left: Expr;
  assign: Token;
  right: Expr;

  constructor(left: Expr, assign: Token, right: Expr) {
    super();
    this.left = left;
    this.assign = assign;
    this.right = right;
  }

  getSubExpressions(): Expr[] {
    return [this.left, this.right];
  }

  toJson(): object {
    return {
      name: "assign",
      left: this.left,
      right: this.right,
      assign: this.assign,
    };
  }

  parse(): string {
    return `${this.left.parse()}${this.assign.text}${this.right.parse()}`;
  }

  getToken(): Token {
    return this.assign;
  }
}

// TODO better name is type specifier
export class TypeName extends Node {
  token: Token;

  constructor(token: Token) {
    super();
    this.token = token;
  }

  toJson(): object {
    return {
      name: "type_name",
      type: this.token,
    };
  }

  parse(): string {
    return this.token.text;
  }

  getToken(): Token {
    return this.token;
  }
}

export class Param extends Node {
  type: TypeName;
  id: Token;
  def: Expr | null;

  constructor(type: TypeName, id: Token, def: Expr | null = null) {
    super();
    this.type = type;
    this.id = id;
    this.def = def;
  }

  toJson(): object {
    return { name: "param", type: this.type, id: this.id };
  }

  parse(): string {
    return `${this.type.parse()} ${this.id.text}`;
  }

  getToken(): Token {
    return this.id;
  }
}

export class FuncDef extends Node {
  type: TypeName;
  id: Token;
  params: Param[];
  body: Expr[];

  constructor(type: TypeName, id: Token, params: Param[], body: Expr[]) {
    super();
    this.type = type;
    this.id = id;
    this.params = params;
    this.body = body;
  }

  toJson(): object {
    return {
      name: "func_def",
      id: this.id,
      params: this.params,
      body: this.body,
    };
  }

  parse(): string {
    return `${this.type.parse()} ${this.id.text}(${commaSeparatedNodes(
      this.params
    )}){${lineSeparatedNodes(this.body)}}\n`;
  }

  getToken(): Token {
    return this.id;
  }
}

export class Return extends Expr {
  expr: Expr;
  ret: Token;

  constructor(expr: Expr, ret: Token) {
    super();
    this.expr = expr;
    this.ret = ret;
  }

  toJson(): object {
    return { name: "return", expr: this.expr };
  }

  parse(): string {
    return `return ${this.expr}`;
  }

  getToken(): Token {
    return this.ret;
  }

  getSubExpressions(): Expr[] {
    return [this.expr];
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
