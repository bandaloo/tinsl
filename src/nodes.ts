import type { Token } from "moo";

// TODO stricter types for operator string
// TODO do we want a list of tokens for each node?

// TODO check the json conversion functions for tokens

function commaSeparatedNodes(exprs: Node[]) {
  return exprs.map((s) => s.translate()).join();
}

function lineSeparatedNodes(exprs: Node[]) {
  return "\n" + exprs.map((s) => s.translate()).join(";\n");
}

abstract class Node {
  abstract toJson(): object;
  abstract translate(): string;
  abstract getToken(): Token; // TODO change this to tokens?
  toString() {
    return JSON.stringify(this.toJson());
  }
}

// TODO not quite the right name; includes stmts and exprs
abstract class Expr extends Node {
  abstract getSubExpressions(): Expr[];
}

export class RenderBlock extends Node {
  once: boolean;
  inNum: number | null;
  outNum: number;
  loopNum: number | null;
  body: Expr[]; // TODO rename to body?
  open: Token;

  constructor(
    once: boolean,
    body: Expr[],
    inNum: number | null,
    outNum: number,
    loopNum: number | null,
    open: Token
  ) {
    super();
    this.once = once;
    this.body = body;
    this.inNum = inNum;
    this.outNum = outNum;
    this.loopNum = loopNum;
    this.open = open;
  }

  toJson(): object {
    return {
      name: "render_block",
      in: this.inNum,
      out: this.outNum,
      once: this.once,
      loop: this.loopNum,
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    throw new Error("parse for render blocks not implemented yet");
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
      operator: this.operator.text,
      right: this.right.toJson(),
    };
  }

  translate() {
    return `(${this.left.translate()}${
      this.operator.text
    }${this.right.translate()})`;
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

  translate() {
    return `(${this.operator}${this.argument.translate()})`;
  }

  toJson() {
    return {
      name: "unary_expr",
      operator: this.operator.text,
      argument: this.argument.toJson(),
      fix: this.postfix ? "postfix" : "prefix",
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

  translate() {
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

  translate(): string {
    return `${this.call.translate}(${commaSeparatedNodes(this.args)})`;
  }

  toJson(): object {
    return {
      name: "call_expr",
      call: this.call.toJson(),
      args: this.args.map((e) => e.toJson()),
    };
  }
}

export class ConstructorExpr extends Expr {
  open: Token;
  typ: TypeName;
  args: Expr[];

  constructor(open: Token, typ: TypeName, args: Expr[]) {
    super();
    this.open = open;
    this.typ = typ;
    this.args = args;
  }

  getSubExpressions(): Expr[] {
    return this.args;
  }

  getToken(): Token {
    return this.open;
  }

  translate(): string {
    return `${this.typ.translate()}(${commaSeparatedNodes(this.args)})`;
  }

  toJson(): object {
    return {
      name: "constructor_expr",
      typ: this.typ.toJson(),
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

  translate(): string {
    return `${this.call.translate()}[${this.index.translate()}]`;
  }

  toJson(): object {
    return {
      name: "subscript_expr",
      call: this.call.toJson,
      index: this.index,
    };
  }
}

export class Decl extends Expr {
  constant: boolean;
  typ: TypeName;
  id: Token;
  expr: Expr;
  assign: Token;

  constructor(
    constant: boolean,
    typ: TypeName,
    id: Token,
    expr: Expr,
    assign: Token
  ) {
    super();
    this.constant = constant;
    this.typ = typ;
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
      typ: this.typ.toJson(),
      id: this.id.text,
      expr: this.expr.toJson(),
    };
  }

  translate(): string {
    return `${this.constant ? "const " : ""}${this.typ.translate()}${
      this.id.text
    }=${this.expr.translate}`;
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
      left: this.left.toJson(),
      right: this.right.toJson(),
      assign: this.assign.text,
    };
  }

  translate(): string {
    return `${this.left.translate()}${
      this.assign.text
    }${this.right.translate()}`;
  }

  getToken(): Token {
    return this.assign;
  }
}

// TODO better name is type specifier
export class TypeName extends Node {
  token: Token;
  size: number | null; // size of 0 is unspecified, aka `float[]`

  constructor(token: Token, size: number | null = null) {
    super();
    this.token = token;
    this.size = size;
  }

  toJson(): object {
    return {
      name: "type_name",
      typ: this.token.text,
      size: this.size,
    };
  }

  translate(): string {
    return this.token.text;
  }

  getToken(): Token {
    return this.token;
  }
}

export class Param extends Node {
  typ: TypeName;
  id: Token;
  def: Expr | null;

  constructor(typ: TypeName, id: Token, def: Expr | null = null) {
    super();
    this.typ = typ;
    this.id = id;
    this.def = def;
  }

  toJson(): object {
    return { name: "param", typ: this.typ.toJson(), id: this.id.text };
  }

  translate(): string {
    return `${this.typ.translate()} ${this.id.text}`;
  }

  getToken(): Token {
    return this.id;
  }
}

export class FuncDef extends Node {
  typ: TypeName;
  id: Token;
  params: Param[];
  body: Expr[];

  constructor(typ: TypeName, id: Token, params: Param[], body: Expr[]) {
    super();
    this.typ = typ;
    this.id = id;
    this.params = params;
    this.body = body;
  }

  toJson(): object {
    return {
      name: "func_def",
      id: this.id.text,
      params: this.params.map((e) => e.toJson()),
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    return `${this.typ.translate()} ${this.id.text}(${commaSeparatedNodes(
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
    return { name: "return", expr: this.expr.toJson() };
  }

  translate(): string {
    return `return ${this.expr}`;
  }

  getToken(): Token {
    return this.ret;
  }

  getSubExpressions(): Expr[] {
    return [this.expr];
  }
}

export class TernaryExpr extends Expr {
  bool: Expr;
  expr1: Expr;
  expr2: Expr;
  token: Token;

  constructor(bool: Expr, expr1: Expr, expr2: Expr, token: Token) {
    super();
    this.bool = bool;
    this.expr1 = expr1;
    this.expr2 = expr2;
    this.token = token;
  }

  getSubExpressions(): Expr[] {
    return [this.bool, this.expr1, this.expr2];
  }

  toJson(): object {
    return {
      name: "ternary_expr",
      bool: this.bool.toJson(),
      expr1: this.expr1.toJson(),
      expr2: this.expr2.toJson(),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.token;
  }
}

export class ForLoop extends Expr {
  init: Expr | null;
  cond: Expr | null;
  loop: Expr | null;
  body: Expr[];
  token: Token;

  constructor(
    init: Expr | null,
    cond: Expr | null,
    loop: Expr | null,
    body: Expr[],
    token: Token
  ) {
    super();
    this.init = init;
    this.cond = cond;
    this.loop = loop;
    this.body = body;
    this.token = token;
  }

  getSubExpressions(): Expr[] {
    return this.body;
  }

  toJson(): object {
    return {
      name: "for_loop",
      init: this.init,
      cond: this.cond,
      loop: this.loop,
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.token;
  }
}

export class If extends Expr {
  cond: Expr;
  body: Expr[];
  token: Token;
  cont: Else | null;

  constructor(cond: Expr, body: Expr[], token: Token, cont: Else | null) {
    super();
    this.cond = cond;
    this.body = body;
    this.token = token;
    this.cont = cont;
  }

  getSubExpressions(): Expr[] {
    throw new Error("Method not implemented.");
  }

  toJson(): object {
    return {
      name: "if",
      cond: this.cond,
      body: this.body,
      cont: this.cont,
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    throw new Error("Method not implemented.");
  }
}

export class Else extends Expr {
  body: Expr[];
  token: Token;

  constructor(body: Expr[], token: Token) {
    super();
    this.body = body;
    this.token = token;
  }

  getSubExpressions(): Expr[] {
    return this.body;
  }

  toJson(): object {
    return {
      name: "else",
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.token;
  }
}

export class Uniform extends Node {
  typ: TypeName;
  ident: Token;

  constructor(typ: TypeName, ident: Token) {
    super();
    this.typ = typ;
    this.ident = ident;
  }

  toJson(): object {
    return { name: "uniform", ident: this.ident.text };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.ident;
  }
}

export type { Node, Expr };
