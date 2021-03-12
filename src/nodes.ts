import type { Token } from "moo";
import { colors } from "./colors";
import { TinslError, wrapErrorHelper } from "./err";
import {
  binaryTyping,
  builtIns,
  callReturnType,
  compareTypes,
  constructors,
  isMat,
  isVec,
  matchingVecScalar,
  matrixAccessTyping,
  SpecType,
  SpecTypeSimple,
  ternaryTyping,
  typeToString,
  unaryTyping,
  vectorAccessTyping,
} from "./typing";
import { toColorKey } from "./util";

// TODO stricter types for operator string
// TODO do we want a list of tokens for each node?

// TODO check the json conversion functions for tokens
const atomicIntHint =
  "e.g. `42` or `some_num` where `def some_num 42` is defined earlier. " +
  "these restrictions apply to expressions for source/target texture numbers " +
  "or loop numbers of render blocks";

export function compileTimeInt(expr: Expr, scope: LexicalScope) {
  if (expr instanceof IntExpr) return parseInt(expr.getToken().text);
  if (
    expr instanceof UnaryExpr &&
    expr.argument instanceof IntExpr &&
    ["+", "-"].includes(expr.operator.text)
  )
    return parseInt(expr.operator.text + expr.argument.getToken());
  if (expr instanceof IdentExpr) {
    const res = scope.resolve(expr.getToken().text);
    if (res instanceof TopDef && res.expr instanceof IntExpr) {
      return parseInt(res.expr.getToken().text);
    }
  }
  return null;
}

export function compileTimeParam(expr: Expr, scope: LexicalScope) {
  if (expr instanceof IdentExpr) {
    const res = scope.resolve(expr.getToken().text);
    if (res instanceof Param) {
      return res;
    }
  }
  return null;
}

function typeCheckExprStmts(
  arr: ExSt[],
  scope: LexicalScope,
  inRenderBlock = false
) {
  for (const e of arr) {
    if (e instanceof Expr) {
      const typ = e.getType(scope);
      if (inRenderBlock && typ !== "vec4")
        throw new TinslError(
          "expressions must be of type vec4 in render block"
        );
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

type IdentResult = TopDef | VarDecl | FuncDef | ProcDef | Param;

interface IdentDictionary {
  [key: string]: IdentResult | undefined;
  // TODO but TopDef and FuncDef can only be at top level
}

export class LexicalScope {
  private upperScope?: LexicalScope;
  private idents: IdentDictionary = {};
  private _returnType?: SpecType;
  private _funcName?: string;

  get returnType(): SpecType | undefined {
    return this._returnType;
  }

  get funcName(): string | undefined {
    return this._funcName;
  }

  set returnType(typ: SpecType | undefined) {
    this._returnType = typ;
    if (this.upperScope === undefined) return;
    this.upperScope.returnType = typ;
  }

  constructor(
    upperScope?: LexicalScope,
    returnType?: SpecType,
    funcName?: string
  ) {
    this.upperScope = upperScope;
    this._returnType = returnType ?? upperScope?._returnType;
    this._funcName = funcName ?? upperScope?._funcName;
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
  cachedType?: SpecType;

  validLVal: "valid" | "const" | "final" | "invalid" = "invalid";

  abstract getType(scope?: LexicalScope): SpecType;
  abstract getSubExpressions(): Expr[];
  isConst(scope: LexicalScope): boolean {
    return this.getSubExpressions().every((e) => e.isConst(scope));
  }

  wrapError(
    callback: (scope: LexicalScope) => SpecType,
    scope: LexicalScope | undefined
  ): SpecType {
    if (this.cachedType !== undefined) return this.cachedType;
    if (scope === undefined) throw new Error("TODO make this impossible");
    this.cachedType = wrapErrorHelper(callback, this, scope);
    return this.cachedType;
  }
}

export type ExSt = Expr | Stmt;

abstract class DefLike extends Stmt {
  params: Param[];

  constructor(params: Param[]) {
    super();
    this.params = params;
  }

  checkDefaultsTrailing(): void {
    let trailStarted = false;
    for (const p of this.params) {
      if (p.def !== null && !trailStarted) {
        trailStarted = true;
        break;
      }

      if (p.def !== null && !trailStarted) {
        trailStarted = true;
        break;
      }
    }
  }

  argsValid(args: Expr[], scope: LexicalScope): void {
    const kind = this instanceof ProcDef ? "procedure" : "function";
    const name = this.getToken().text;
    const defaultsNum = this.params.filter((p) => p.def !== null).length;

    const err = (str: string) =>
      new TinslError(`too ${str} arguments for ${kind} call ${name}`);

    if (this.params.length - defaultsNum > args.length) throw err("few");
    if (this.params.length < args.length) throw err("many");

    const paramTypes = this.params.map((p) => p.getRightType());
    const argTypes = args.map((a) => a.getType(scope));

    // TODO make sure default arguments in definition are all trailing

    // number of arguments lte to number of params because of defaults
    for (let i = 0; i < argTypes.length; i++) {
      if (paramTypes[i] !== argTypes[i])
        throw new TinslError(
          `argument ${i} has wrong type. is ${argTypes[i]} \
but needs to be ${paramTypes[i]} for ${kind} call "${name}"`
        );

      if (this.params[i].pureInt && compileTimeInt(args[i], scope) === null) {
        throw new TinslError(
          `in function "${this.getToken().text}", argument for parameter "${
            this.params[i].getToken().text
          }" is not a compile time atomic int, ${atomicIntHint}`
        );
      }
    }
  }
}

function branchContainsReturn(exSts: ExSt[]) {
  return exSts.some(
    (e) => e instanceof Return || (e instanceof If && e.returnsInBoth())
  );
}

// TODO is this really a statement?
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

  typeCheck(): void {
    typeCheckExprStmts(this.body, this.topScope);
  }

  toJson(): object {
    return { name: "program", body: this.body.map((e) => e.toJson()) };
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

  private cachedRefresh?: boolean;

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

  containsRefresh(): boolean {
    if (this.cachedRefresh !== undefined) return this.cachedRefresh;
    let refresh = false;
    for (const e of this.body) {
      refresh ||=
        e instanceof Refresh ||
        (e instanceof RenderBlock && e.containsRefresh());
    }
    this.cachedRefresh = refresh;
    return refresh;
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

  getExprStmts(): Expr[] {
    return [
      ...(this.inNum instanceof Expr ? [this.inNum] : []),
      ...(this.outNum instanceof Expr ? [this.outNum] : []),
      ...(this.loopNum instanceof Expr ? [this.loopNum] : []),
    ];
  }

  getToken(): Token {
    return this.open;
  }

  typeCheck(scope: LexicalScope): void {
    const checkNum = (num: number | Expr | null, str: string) => {
      if (num === null || typeof num === "number") return num;

      const int = compileTimeInt(num, scope);
      if (int !== null) return int;

      const param = compileTimeParam(num, scope);
      if (param !== null && param.getRightType() === "int") {
        param.pureInt = true;
        return num;
      }

      throw new TinslError(`expression for ${str} number in render block \
is not a compile time atomic int, ${atomicIntHint}`);
    };

    this.inNum = checkNum(this.inNum, "source texture");
    this.outNum = checkNum(this.outNum, "destination texture");
    this.loopNum = checkNum(this.loopNum, "loop");

    const innerScope = new LexicalScope(scope);
    typeCheckExprStmts(this.body, innerScope, true);
  }
}

export class BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;
  isLeftHand = false; // TODO do we need this?
  isLengthAccess = false;

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
        // is .length accessing an array
        if (
          this.right instanceof IdentExpr &&
          this.right.getToken().text === "length"
        ) {
          if (typeof lType !== "object") {
            throw new TinslError("can only do .length on an array");
          }
          this.isLengthAccess = true;
          return "int";
        }

        if (typeof lType === "string" && !isVec(lType)) {
          throw new TinslError(`left side of ${op} op must be a vector`);
        }

        if (!(this.right instanceof IdentExpr)) {
          throw new TinslError(
            `right side of ${op} op must be components to access`
          );
        }

        const ret = vectorAccessTyping(
          this.right.getToken().text,
          lType,
          this.isLeftHand
        );

        // valid l-value when accessing a not constant-declared
        this.validLVal =
          this.left.validLVal !== "const" && this.left.validLVal !== "final"
            ? "valid"
            : this.left.validLVal;

        return ret;
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

      const helper = (str: string) => {
        return new TinslError(
          `identifier ${name} is a ${str} definition, not an expression`
        );
      };
      if (res instanceof FuncDef) throw helper("function");
      if (res instanceof ProcDef) throw helper("procedure");
      if (res instanceof VarDecl) {
        this.validLVal = res.access === "mut" ? "valid" : res.access;
      }
      return res.getRightType(scope);
    }, scope);
  }

  isConst(scope: LexicalScope): boolean {
    const name = this.getToken().text;
    const res = scope.resolve(name);
    return (
      (res instanceof VarDecl && res.access === "const") ||
      (res instanceof TopDef && res.expr.isConst(scope))
    );
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
    // TODO translate this differently if frag
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
      if (this.call instanceof BinaryExpr) {
        this.call.getType(scope);
        if (!this.call.isLengthAccess) {
          throw new TinslError("invalid function call on a binary expression");
        }
        if (this.args.length > 0) {
          throw new TinslError(
            ".length() takes no arguments " +
              "(you could also leave off the parentheses entirely, " +
              "using it like a property, e.g. just `some_array.length`)"
          );
        }
        return "int";
      }
      if (this.call instanceof Frag) {
        if (this.args.length === 0)
          throw new TinslError(
            "can not call frag with no arguments. " +
              "just use `frag` on its own"
          );

        const frag = this.call;
        const helper = (typ: SpecTypeSimple) => {
          const list = this.args.filter((x) => x.getType(scope) === typ);
          if (list.length > 1)
            throw new TinslError(
              `cannot have more than one ${typ} as an argument to "frag"`
            );
          return list.length === 1 ? list[0] : null;
        };

        const int = helper("int");

        if (frag.sampler !== null && int !== null)
          throw new TinslError(
            "sampler number already defined in the identifier name; " +
              "cannot also be passed in as an argument. sampler: " +
              frag.sampler
          );

        if (int !== null) {
          const num = compileTimeInt(int, scope);
          if (
            num === null &&
            !(
              int instanceof IdentExpr &&
              scope.resolve(int.getToken().text) instanceof Param
            )
          )
            throw new TinslError(
              "sampler number for frag has to be a compile time atomic int, " +
                atomicIntHint
            );
          frag.sampler = num;
        }

        const vec2 = helper("vec2");
        frag.pos = vec2;

        // TODO might have to change if we support different texture types
        return "vec4";
      }

      if (!(this.call instanceof IdentExpr)) {
        throw new TinslError("invalid function call");
      }

      const name = this.call.getToken().text;

      if (name === scope.funcName)
        throw new TinslError(`recursive call to "${name}" is not allowed`);

      const info = builtIns[name];
      if (info !== undefined) {
        return callReturnType(
          this.args.map((a) => a.getType(scope)),
          info,
          name
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
      // make sure all the argument types match the param types
      res.argsValid(this.args, scope);
      return res.getReturnType();
    }, scope);
  }

  isConst(scope: LexicalScope): boolean {
    // built-in function calls with all constant args are constant expressions
    return (
      builtIns[this.call.getToken().text] !== undefined && super.isConst(scope)
    );
  }

  isLengthCall() {
    if (
      this.call instanceof IdentExpr &&
      this.call.getToken().text === "length"
    ) {
      if (this.args.length !== 0) {
        throw new TinslError(".length() on an array can not have arguments");
      }
      return true;
    }
    return false;
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
      args: this.args.map((e) => e.toJson()),
    };
  }

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError(() => {
      if (this.typ.size !== null) {
        const arrType = this.typ.getToken().text as SpecTypeSimple;
        for (const a of this.args) {
          if (a.getType(scope) !== arrType) {
            throw new TinslError(
              `argument in array constructor is not of type ${arrType}`
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
      if (info === undefined) throw new Error("constructor not found");
      const argTypes = this.args.map((a) => a.getType(scope));
      return callReturnType(argTypes, info, this.typ.getToken().text);
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
      call: this.call.toJson(),
      index: this.index,
    };
  }

  getType(scope?: LexicalScope): SpecType {
    const callType = this.call.getType(scope);

    // valid l-value when accessing a not constant-declared
    // TODO update this for final
    this.validLVal =
      this.call.validLVal !== "const" && this.call.validLVal !== "final"
        ? "valid"
        : this.call.validLVal;

    if (typeof callType === "string") {
      if (isVec(callType)) {
        return matchingVecScalar(callType);
      }
      if (isMat(callType)) {
        return matrixAccessTyping(callType);
      }
      throw new TinslError(
        "can only index arrays and vectors with square brackets"
      );
    }
    const indexType = this.index.getType(scope);
    if (!(indexType === "int" || indexType === "uint")) {
      throw new TinslError("index must be an integer");
    }

    return callType.typ;
  }
}

type accessType = "mut" | "const" | "final";

// TODO would be easier if this were an expression
export class VarDecl extends Stmt {
  access: accessType;
  typ: TypeName | null;
  id: Token;
  expr: Expr;
  assign: Token;

  constructor(
    access: accessType,
    typ: TypeName | null,
    id: Token,
    expr: Expr,
    assign: Token
  ) {
    super();
    this.access = access;
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
      name: "var_decl",
      typ: this.typ === null ? null : this.typ.toJson(),
      id: this.id.text,
      expr: this.expr.toJson(),
    };
  }

  translate(): string {
    throw new Error("Method not implemented");
  }

  getToken(): Token {
    return this.id;
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      scope.addToScope(this.id.text, this);
      if (this.access === "const" && !this.expr.isConst(scope)) {
        throw new TinslError(
          "right side of assignment is not a constant expression"
        );
      }
      const typ = this.expr.getType(scope); // just to set up attributes in expr
      if (this.typ === null) return;
      if (!this.typ.equals(typ)) {
        throw new TinslError(
          `left side type, ${typeToString(
            this.typ.toSpecType()
          )} of declaration does not match right side type, ${typeToString(
            this.expr.getType(scope)
          )}`
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
    if (!this.left.validLVal) {
      throw new TinslError("left side of assignment is not valid");
    }

    const leftType = this.left.getType(scope);
    const rightType = this.right.getType(scope);

    if (!compareTypes(leftType, rightType)) {
      throw new TinslError(
        `left side of assignment was ${typeToString(
          leftType
        )} but right side expression was ${typeToString(rightType)}`
      );
    }

    if (this.left.validLVal !== "valid") {
      throw new TinslError(
        "invalid l-value in assignment" +
          (this.left.validLVal === "const"
            ? ". this is because it was declared as constant"
            : this.left.validLVal === "final"
            ? '. this is because the l-value was declared as "final". ' +
              "variables declared with := are final by default. " +
              'to declare a mutable variable this way, use "mut" before ' +
              "the variable name, e.g. `mut foo := 42;`"
            : "")
      );
    }
  }
}

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

  toSpecType(): SpecType {
    const simple = this.token.text as SpecTypeSimple;
    if (this.size === null) return simple;
    return { typ: simple, size: this.size };
  }

  // TODO might not need this
  equals(typ: SpecType): boolean {
    if (typeof typ === "string") {
      if (this.size !== null) return false;
      return this.token.text === typ;
    }

    return (
      (this.size === 0 || typ.size === this.size) && typ.typ === this.token.text
    );
  }
}

export class Param extends Node {
  typ: TypeName;
  id: Token;
  def: ExSt | null;
  pureInt = false;

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

export class FuncDef extends DefLike {
  typ: TypeName | null;
  id: Token;
  body: ExSt[];
  private inferredType?: SpecType;

  constructor(typ: TypeName | null, id: Token, params: Param[], body: ExSt[]) {
    super(params);
    this.typ = typ;
    this.id = id;
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
    /*
    return `${this.typ.translate()} ${this.id.text}(${commaSeparatedNodes(
      this.params
    )}){${lineSeparatedNodes(this.body)}}\n`;
    */
    throw new Error("not implemented");
  }

  getToken(): Token {
    return this.id;
  }

  getExprStmts(): ExSt[] {
    return this.body;
  }

  typeCheck(scope: LexicalScope): void {
    // TODO recursive functions are not allowed
    this.wrapError((scope: LexicalScope) => {
      if (this.typ !== null) {
        const ret = this.typ.toSpecType();
        if (typeof ret === "object" && ret.size === 0) {
          throw new TinslError(`functions that return an array must have \
a defined size in the return type specifier`);
        }
        if (!branchContainsReturn(this.body)) {
          throw new TinslError(
            `function "${
              this.getToken().text
            }" does not definitely return a value. this may be because it does \
not contain a return statement in all conditional branches`
          );
        }
      }

      scope.addToScope(this.getToken().text, this);
      const innerScope = new LexicalScope(
        scope,
        this.typ !== null ? this.typ.toSpecType() : undefined,
        this.getToken().text
      );

      innerScope.returnType =
        this.typ === null ? undefined : this.typ.toSpecType();
      // add all the params to the scope
      for (const p of this.params) innerScope.addToScope(p.getToken().text, p);
      typeCheckExprStmts(this.body, innerScope);
      this.inferredType = innerScope.returnType;
    }, scope);
  }

  getReturnType(): SpecType {
    if (this.inferredType !== undefined) return this.inferredType;
    throw new Error(
      "inferred type was null (possibly called before typeCheck)"
    );
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
    if (scope.returnType === undefined) {
      scope.returnType = exprType;
      return;
    }

    if (compareTypes(this.expr.getType(scope), scope.returnType)) return;
    // TODO better error message
    throw new TinslError(
      `function return type does not match. \
return expression was of type ${typeToString(exprType)} \
but the function should return ${typeToString(scope.returnType)}`
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
      const { inner, outer } = this.getExprStmts();
      const innerScope = new LexicalScope(scope);
      typeCheckExprStmts(outer, scope);
      typeCheckExprStmts(inner, innerScope);

      // has to be after checking the other expressions or else unknown ident
      if (this.cond !== null && this.cond.getType(scope) !== "bool") {
        throw new TinslError("conditional in a for loop must be a boolean");
      }
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
    return this.token;
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      if (this.cond.getType(scope) !== "bool")
        throw new TinslError("if condition must be a boolean expression");
      const innerScope = new LexicalScope(scope);
      typeCheckExprStmts(this.body, innerScope);
    }, scope);
  }

  returnsInBoth(): boolean {
    return (
      branchContainsReturn(this.body) &&
      this.cont !== null &&
      branchContainsReturn(this.cont.body)
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

export class ProcDef extends DefLike {
  id: Token;
  body: ExSt[];

  constructor(id: Token, params: Param[], body: ExSt[]) {
    super(params);
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
    return this.id;
  }

  getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] } {
    return this.body;
  }

  typeCheck(scope: LexicalScope): void {
    scope.addToScope(this.getToken().text, this);
    const innerScope = new LexicalScope(scope);
    for (const p of this.params) innerScope.addToScope(p.getToken().text, p);
    typeCheckExprStmts(this.body, innerScope);
  }
}

export class ProcCall extends Stmt {
  open: Token;
  call: IdentExpr;
  args: Expr[];

  constructor(open: Token, call: IdentExpr, args: Expr[]) {
    super();
    this.open = open;
    this.call = call;
    this.args = args;
  }

  getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] } {
    return this.args;
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      const name = this.call.getToken().text;
      const res = scope.resolve(this.call.getToken().text);
      if (!(res instanceof ProcDef))
        throw new TinslError(
          `identifier "${name}" does not refer to a procedure definition`
        );

      res.argsValid(this.args, scope);
    }, scope);
  }

  toJson(): object {
    return {
      name: "proc_call",
      call: this.call.toJson(),
      args: this.args.map((e) => e.toJson()),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.open;
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
    scope.addToScope(this.getToken().text, this);
    this.getRightType(scope);
  }

  getRightType(scope?: LexicalScope) {
    return this.expr.getType(scope);
  }
}

abstract class Basic extends Expr {
  token: Token;
  abstract typ: SpecTypeSimple;
  abstract name: string;

  constructor(token: Token) {
    super();
    this.token = token;
  }

  getType(scope?: LexicalScope): SpecType {
    return this.typ;
  }

  getSubExpressions(): Expr[] {
    return [];
  }

  toJson(): object {
    return { name: this.name };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.token;
  }
}

export class Pos extends Basic {
  typ: SpecTypeSimple = "vec2";
  name: string = "coord";
}

export class Res extends Basic {
  typ: SpecTypeSimple = "vec2";
  name: string = "res";
}

export class Time extends Basic {
  typ: SpecTypeSimple = "float";
  name: string = "time";
}

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
    // TODO this won't actually translate; just indicate a shader break
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
  pos: Expr | null = null;
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

export class ColorString extends Expr {
  str: string;
  id: Token;
  num: number | null;

  constructor(id: Token, num: number | null = null) {
    super();
    this.str = id.text.substr(1, id.text.length - 2);
    this.id = id;
    this.num = num;
  }

  getType(scope?: LexicalScope): SpecType {
    return this.wrapError((scope: LexicalScope) => {
      if (this.num !== null && this.num !== 3 && this.num !== 4)
        throw new TinslError(
          "can only specify suffix number of 3 or 4 for color strings"
        );

      const numType = (def: number) =>
        ("vec" + (this.num ?? def)) as SpecTypeSimple;

      if (/^#[0-9|a-f|A-F]{6}$/.test(this.str)) return numType(3);
      else if (/^#[0-9|a-f|A-F]{8}$/.test(this.str)) return numType(4);

      if (this.str[0] === "#")
        throw new TinslError(`invalid hex color "${this.str}"`);
      if (colors[toColorKey(this.str)] === undefined)
        throw new TinslError(
          `color string "${this.str}" did not match any colors. supported colors \
are the HTML named color values, which can be seen here: \
https://www.w3schools.com/colors/colors_hex.asp` +
            (toColorKey(this.str) !== this.str
              ? ` (color strings are insensitive to \
capitalization and whitespace, so "${this.str}" \
is the same as "${toColorKey(this.str)}")`
              : "")
        );
      return numType(3);
    }, scope);
  }

  getSubExpressions(): Expr[] {
    return [];
  }

  toJson(): object {
    return { name: "color_string", str: this.str };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.id;
  }

  isConst(): boolean {
    return true;
  }
}
