import type { Token } from "moo";
import { TinslError, wrapErrorHelper } from "./err";
import { checkExpr } from "./testhelpers";
import {
  binaryTyping,
  builtIns,
  callReturnType,
  constructors,
  extractMatrixDimensions,
  extractVecBase,
  isVec,
  SpecType,
  SpecTypeSimple,
  ternaryTyping,
  unaryTyping,
  vectorAccessTyping,
} from "./typing";

// TODO stricter types for operator string
// TODO do we want a list of tokens for each node?

// TODO check the json conversion functions for tokens

function typeCheckExprStmts(arr: ExSt[], scope: LexicalScope) {
  for (const e of arr) {
    if (e instanceof Expr) {
      e.getType(scope);
    } else {
      e.typeCheck(scope);
    }
  }
}

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

type IdentResult = TopDef | Decl | FuncDef | Param;

interface IdentDictionary {
  [key: string]: IdentResult | undefined;
  // TODO but TopDef and FuncDef can only be at top level
}

export class LexicalScope {
  private upperScope?: LexicalScope;
  private idents: IdentDictionary = {};
  private _returnType?: SpecType;

  get returnType() {
    return this._returnType;
  }

  constructor(upperScope?: LexicalScope, returnType?: SpecType) {
    this.upperScope = upperScope;
    this._returnType = returnType ?? upperScope?.returnType;
  }

  addToScope(name: string, result: IdentResult) {
    if (this.idents[name] !== undefined) {
      throw new TinslError(`duplicate identifier "${name}"`);
    }
    this.idents[name] = result;
  }

  resolve(name: string): IdentResult | undefined {
    if (this.idents[name] !== undefined) return this.idents[name];
    if (this.upperScope === undefined) return;
    return this.upperScope.resolve(name);
  }
}

export abstract class Stmt extends Node {
  abstract getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] };
  abstract typeCheck(scope: LexicalScope): void;

  wrapError(
    callback: (scope: LexicalScope) => void,
    scope: LexicalScope
  ): void {
    return wrapErrorHelper(callback, this, scope);
  }
}

export abstract class Expr extends Node {
  cachedType: SpecType | undefined;
  abstract getType(scope?: LexicalScope): SpecType;
  abstract getSubExpressions(): Expr[];

  wrapError(
    callback: (scope: LexicalScope) => SpecType,
    scope: LexicalScope | undefined
  ): SpecType {
    if (scope === undefined) {
      if (this.cachedType === undefined)
        throw new Error(
          "cached type and lexical scope were somehow both undefined"
        );
      return this.cachedType;
    }
    return wrapErrorHelper(callback, this, scope);
  }
}

export type ExSt = Expr | Stmt;

function branchContainsReturn(exSts: ExSt[]) {
  return exSts.some(
    (e) => e instanceof Return || (e instanceof If && e.returnsInBoth())
  );
}

export class TinslProgram extends Stmt {
  topScope: LexicalScope = new LexicalScope();
  body: ExSt[];

  constructor(body: ExSt[]) {
    super();
    this.body = body;
  }

  getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] } {
    return { outer: [], inner: this.body };
  }

  typeCheck(scope: LexicalScope = new LexicalScope()): void {
    typeCheckExprStmts(this.body, scope);
  }

  toJson(): object {
    throw new Error("Method not implemented.");
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    throw new Error("cannot get token of outer program");
  }
}

export class RenderBlock extends Stmt {
  once: boolean;
  inNum: number | Expr | null;
  outNum: number | Expr | null;
  loopNum: number | Expr | null;
  body: ExSt[];
  open: Token;

  constructor(
    once: boolean,
    body: ExSt[],
    inNum: number | Expr | null,
    outNum: number | Expr | null,
    loopNum: number | Expr | null,
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

  getExprStmts(): Expr[] {
    throw new Error("Method not implemented.");
  }

  typeCheck(scope: LexicalScope): void {
    // TODO if inNum, outNum and loopNum are idents make sure they can be
    // determined at compile time
    const innerScope = new LexicalScope(scope);
    typeCheckExprStmts(this.body, innerScope);
  }
}

export class BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;
  isLeftHand = false; // TODO update this in validator

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

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(() => {
      const lType = this.left.getType(scope);
      const op = this.operator.text;

      // dots can only act on vecs for now (no structs)
      if (this.operator.text === ".") {
        if (typeof lType === "string" && !isVec(lType)) {
          throw new TinslError(`left side of ${op} op must be a vector`);
        }
        if (!(this.right instanceof IdentExpr)) {
          throw new TinslError(
            `right side of ${op} op must be components to access`
          );
        }

        return vectorAccessTyping(
          this.right.getToken().text,
          lType,
          this.isLeftHand
        );
      }

      return binaryTyping(op, lType, this.right.getType(scope));
    }, scope);
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

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(
      () => unaryTyping(this.operator.text, this.argument.getType(scope)),
      scope
    );
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

  getType(scope?: LexicalScope): SpecType {
    return "float";
  }
}

export class IntExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("int_expr");
  }

  getType(scope?: LexicalScope): SpecType {
    return "int";
  }
}

export class UIntExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("uint_expr");
  }

  getType(scope?: LexicalScope): SpecType {
    return "uint";
  }
}

export class BoolExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("bool_expr");
  }

  getType(scope?: LexicalScope): SpecType {
    return "bool";
  }
}

export class IdentExpr extends AtomExpr {
  toJson() {
    return this.jsonHelper("ident_expr");
  }

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(() => {
      if (scope === undefined)
        throw new Error(
          "scope was somehow undefined when trying to resolve identifier"
        );
      const name = this.getToken().text;
      const res = scope.resolve(name);
      if (res === undefined)
        throw new TinslError(`undefined identifier ${name}`);
      if (res instanceof FuncDef)
        throw new TinslError(
          `identifier ${name} is a function definition, not an expression`
        );
      return res.getRightType(scope);
    }, scope);
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

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError((scope: LexicalScope) => {
      if (!(this.call instanceof IdentExpr)) {
        throw new TinslError("invalid function call");
      }
      const name = this.call.getToken().text;
      const info = builtIns[name];
      if (info !== undefined) {
        // TODO better error message
        return callReturnType(
          this.args.map((a) => a.getType(scope)),
          info
        );
      }
      // not a built-in, so try to resolve identifier name
      const res = scope.resolve(name);
      if (res === undefined) {
        throw new TinslError(`function "${name}" is not defined`);
      }
      if (!(res instanceof FuncDef)) {
        throw new TinslError(
          `identifier "${name}" does not refer to a function definition`
        );
      }
      return res.typ.toSpecType();
    }, scope);
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

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(() => {
      if (this.typ.size !== null) {
        const arrType = this.typ.getToken().text as SpecTypeSimple;
        // TODO matching sizes
        for (const a of this.args) {
          if (a.getType(scope) !== arrType) {
            throw new TinslError(
              `argument in array constructor was not of type ${arrType}`
            );
          }
        }
        if (this.typ.size !== 0 && this.typ.size !== this.args.length) {
          throw new TinslError(`${this.args.length} args passed into array \
constructor but needed ${this.typ.size} because size was specified. to fix, \
you can leave the size unspecified with ${arrType}[] instead of \
${arrType}[${this.args.length}]`);
        }
        return { typ: arrType, size: this.args.length };
      }
      const info = constructors[this.typ.getToken().text];
      const argTypes = this.args.map((a) => a.getType(scope));
      return callReturnType(argTypes, info);
    }, scope);
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

  getType(scope?: LexicalScope): SpecType {
    throw new Error("Method not implemented.");
  }
}

// TODO would be easier if this were an expression
export class Decl extends Stmt {
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

  getExprStmts(): ExSt[] {
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
    return this.id;
  }

  typeCheck(scope: LexicalScope): void {
    // TODO add itself to lexical scope
    this.wrapError((scope: LexicalScope) => {
      if (!this.typ.equals(this.expr.getType(scope))) {
        throw new TinslError(
          "left side type of assignment does not match right side type"
        );
      }
    }, scope);
  }

  getRightType(scope?: LexicalScope) {
    return this.expr.getType(scope);
  }
}
export class Assign extends Stmt {
  left: Expr;
  assign: Token;
  right: Expr;

  constructor(left: Expr, assign: Token, right: Expr) {
    super();
    this.left = left;
    this.assign = assign;
    this.right = right;
  }

  getExprStmts(): ExSt[] {
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

  typeCheck(scope: LexicalScope): void {
    throw new Error("Method not implemented.");
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

  // TODO maybe not needed
  toSpecType(): SpecType {
    const simple = this.token.text as SpecTypeSimple;
    if (this.size === null) return simple;
    return { typ: simple, size: this.size };
  }

  equals(typ: SpecType): boolean {
    if (typeof typ === "string") {
      if (this.size !== null) return false;
      return this.token.text === typ;
    }

    return typ.size === this.size && typ.typ === this.token.text;
  }
}

export class Param extends Node {
  typ: TypeName;
  id: Token;
  def: ExSt | null;

  constructor(typ: TypeName, id: Token, def: ExSt | null = null) {
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

  getRightType(): SpecType {
    return this.typ.toSpecType();
  }
}

export class FuncDef extends Stmt {
  typ: TypeName;
  id: Token;
  params: Param[];
  body: ExSt[];

  constructor(typ: TypeName, id: Token, params: Param[], body: ExSt[]) {
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

  getExprStmts(): ExSt[] {
    return this.body;
  }

  typeCheck(scope: LexicalScope): void {
    // TODO recursive functions are not allowed
    // add all the params to the scope
    if (!branchContainsReturn(this.body)) {
      throw new TinslError(
        `function "${
          this.getToken().text
        }" does not definitely return a value. this may be because it does not \
contain a return statement in all conditional branches`
      );
    }

    scope.addToScope(this.getToken().text, this);
    const innerScope = new LexicalScope(scope, this.typ.toSpecType());
    for (const p of this.params) innerScope.addToScope(p.getToken().text, p);
    typeCheckExprStmts(this.body, innerScope);
  }
}

export class Return extends Stmt {
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

  getExprStmts(): ExSt[] {
    return [this.expr];
  }

  typeCheck(scope: LexicalScope): void {
    const exprType = this.expr.getType(scope);
    if (this.expr.getType(scope) === scope.returnType) return;
    // TODO better error message
    throw new TinslError(
      `function return type does not match. \
return expression was of type ${exprType} \
but function definition is supposed to return ${scope.returnType} `
    );
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

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(() => {
      return ternaryTyping(
        this.bool.getType(scope),
        this.expr1.getType(scope),
        this.expr2.getType(scope)
      );
    }, scope);
  }
}

export class ForLoop extends Stmt {
  init: ExSt | null;
  cond: Expr | null;
  loop: ExSt | null;
  body: ExSt[];
  token: Token;

  constructor(
    init: ExSt | null,
    cond: Expr | null,
    loop: ExSt | null,
    body: ExSt[],
    token: Token
  ) {
    super();
    this.init = init;
    this.cond = cond;
    this.loop = loop;
    this.body = body;
    this.token = token;
  }

  getExprStmts() {
    return {
      outer: [
        ...(this.init ? [this.init] : []),
        ...(this.cond ? [this.cond] : []),
        ...(this.loop ? [this.loop] : []),
      ],
      inner: this.body,
    };
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

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      if (this.cond !== null && this.cond.getType(scope) !== "bool") {
        throw new TinslError("conditional in a for loop must be a boolean");
      }
      const { inner, outer } = this.getExprStmts();
      const innerScope = new LexicalScope(scope);
      typeCheckExprStmts(outer, scope);
      typeCheckExprStmts(inner, innerScope);
    }, scope);
  }
}

// TODO stmt
export class If extends Stmt {
  cond: Expr;
  body: ExSt[];
  token: Token;
  cont: Else | null;

  constructor(cond: Expr, body: ExSt[], token: Token, cont: Else | null) {
    super();
    this.cond = cond;
    this.body = body;
    this.token = token;
    this.cont = cont;
  }

  getExprStmts() {
    return { outer: [this.cond], inner: this.body };
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

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      this.cond.getType(scope);
      const innerScope = new LexicalScope(scope);
      typeCheckExprStmts(this.body, innerScope);
    }, scope);
  }

  returnsInBoth(): boolean {
    return (
      branchContainsReturn(this.body) &&
      (this.cont === null || branchContainsReturn(this.cont.body))
    );
  }
}

export class Else extends Stmt {
  body: ExSt[];
  token: Token;

  constructor(body: ExSt[], token: Token) {
    super();
    this.body = body;
    this.token = token;
  }

  getExprStmts(): ExSt[] {
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

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      const innerScope = new LexicalScope(scope);
      typeCheckExprStmts(this.body, innerScope);
    }, scope);
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

export class ProcDef extends Node {
  id: Token;
  params: Param[];
  body: ExSt[];

  constructor(id: Token, params: Param[], body: ExSt[]) {
    super();
    this.id = id;
    this.params = params;
    this.body = body;
  }

  toJson(): object {
    return {
      name: "proc_def",
      id: this.id.text,
      params: this.params.map((e) => e.toJson()),
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    throw new Error("Method not implemented.");
  }
}

export class TopDef extends Stmt {
  id: Token;
  expr: Expr;

  constructor(id: Token, expr: Expr) {
    super();
    this.id = id;
    this.expr = expr;
  }

  toJson(): object {
    return {
      name: "top_def",
      id: this.id.text,
      expr: this.expr,
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.id;
  }

  getExprStmts(): ExSt[] {
    return [this.expr];
  }

  typeCheck(scope: LexicalScope): void {
    throw new Error("Method not implemented.");
  }

  getRightType(scope?: LexicalScope) {
    return this.expr.getType(scope);
  }
}

// TODO statement not expression
export class Refresh extends Stmt {
  id: Token;

  constructor(id: Token) {
    super();
    this.id = id;
  }

  toJson(): object {
    return { name: "refresh" };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.id;
  }

  getExprStmts(): ExSt[] {
    return [];
  }

  typeCheck(scope: LexicalScope): void {
    return;
  }
}

export class Frag extends Expr {
  sampler: number | null;
  tokn: Token;

  constructor(tokn: Token) {
    super();
    const matches = tokn.text.match(/frag([0-9]+)*/);
    if (matches === null) throw new Error("frag matches was null");
    const num = matches[1];
    this.sampler = num === undefined ? null : parseInt(num);
    this.tokn = tokn;
  }

  getSubExpressions(): Expr[] {
    return [];
  }

  getType(): SpecType {
    // TODO this might change if we support different texture types
    return "vec4";
  }

  toJson(): object {
    return { name: "frag", sampler: this.sampler };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.tokn;
  }
}
