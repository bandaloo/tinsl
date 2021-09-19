import { Token } from "moo";
import { colors } from "./colors";
import {
  atomicIntHint,
  lValueHint,
  TinslAggregateError,
  TinslError,
  TinslLineError,
  wrapErrorHelper,
} from "./err";
import { validIdent } from "./lexer";
import { builtIns, constructors } from "./typeinfo";
import { SpecType, SpecTypeSimple } from "./typetypes";
import {
  binaryTyping,
  callReturnType,
  compareTypes,
  matrixAccessTyping,
  ternaryTyping,
  typeToString,
  unaryTyping,
  vectorAccessTyping,
} from "./typing";
import {
  isInIndexableRange,
  isMat,
  isVec,
  matchingVecScalar,
} from "./typinghelpers";
import {
  arrayPad,
  arrHasRepeats,
  hexColorToVector,
  NON_CONST_ID,
  strHasRepeats,
  toColorKey,
} from "./util";

function aggregateIdentError(
  errors: (TinslLineError | TinslAggregateError)[],
  str: string,
  scope: LexicalScope,
  stmt: Stmt
) {
  try {
    stmt.wrapError((scope: LexicalScope) => {
      validIdent(str);
    }, scope);
  } catch (err) {
    if (err instanceof TinslLineError || err instanceof TinslAggregateError) {
      errors.push(err);
    } else {
      throw err;
    }
  }
}

function aggregateFromErrors(errors: (TinslLineError | TinslAggregateError)[]) {
  if (errors.length > 0) {
    throw new TinslAggregateError(
      errors.map((e) => (e instanceof TinslLineError ? e : e.errors)).flat()
    );
  }
}

/** a way to wrap a set of statements with their proc params/args */
export class ParamScoped<T> {
  constructor(public inner: ParamScoped<T> | T, public mapping: ParamScope) {}

  inmost(): T {
    if (!(this.inner instanceof ParamScoped)) return this.inner;
    return this.inner.inmost();
  }

  translate(sl: SourceLeaf) {
    const t = this.inmost();
    if (t instanceof Expr || t instanceof Stmt) {
      return t.translate({ leaf: sl, map: this.mapping });
    }
    throw new Error("inmost not expr or stmt");
  }
}

/** scope for expansion of procedures */
export class ParamScope {
  constructor(
    private mapping: Map<Param, Expr>,
    private outer: ParamScope | null
  ) {}

  get(param: Param): Expr | null {
    const res = this.mapping.get(param);
    if (res !== undefined) return res;
    if (this.outer === null) return null;
    return this.outer.get(param);
  }

  set(param: Param, expr: Expr) {
    this.mapping.set(param, expr);
  }
}

// classes for output in final translation step

export interface TinslTree {
  loop: number;
  once: boolean;
  body: (TinslTree | TinslLeaf)[];
}

export function getAllSamplers(
  node: TinslTree | TinslLeaf,
  set = new Set<number>()
): Set<number> {
  if (isTinslTree(node)) {
    for (const b of node.body) {
      const s = getAllSamplers(b);
      for (const e of s) {
        set.add(e);
      }
    }
    return set;
  }
  return new Set([...node.requires.samplers, node.target]);
  //return new Set(node.requires.samplers);
}

export function isTinslTree(node: TinslTree | TinslLeaf): node is TinslTree {
  return (node as TinslTree).body !== undefined;
}

export class SourceTree {
  loop: number;
  once: boolean;
  body: (SourceTree | SourceLeaf)[];

  constructor(
    loop: number,
    once: boolean,
    body: (SourceTree | SourceLeaf)[] = []
  ) {
    this.loop = loop;
    this.once = once;
    this.body = body;
  }

  output(): TinslTree {
    return {
      loop: this.loop,
      once: this.once,
      body: this.body.map((s) => s.output()),
    };
  }

  log() {
    for (const b of this.body) b.log();
  }
}

export interface UniformRequirements {
  time: boolean;
  resolution: boolean;
  samplers: number[];
  uniforms: { name: string; type: string }[];
}

export interface TinslLeaf {
  target: number;
  requires: UniformRequirements;
  source: string;
}

export function isTinslLeaf(node: TinslTree | TinslLeaf): node is TinslLeaf {
  return (node as TinslLeaf).target !== undefined;
}

export class SourceLeaf {
  outNum: number;
  inNum: number;
  requires: {
    time: boolean;
    res: boolean;
    samplers: Set<number>;
    uniforms: Set<Uniform>;
  } = {
    time: false,
    res: false,
    samplers: new Set(),
    uniforms: new Set(),
  };
  source: string = "";
  //mappings: Map<Param, Expr>;

  constructor(outNum: number, inNum: number) {
    this.outNum = outNum;
    this.inNum = inNum;
  }

  output(): TinslLeaf {
    return {
      target: this.outNum,
      requires: {
        time: this.requires.time,
        resolution: this.requires.res,
        samplers: Array.from(this.requires.samplers).sort((a, b) => a - b),
        uniforms: Array.from(this.requires.uniforms).map((u) => {
          return {
            name: u.getToken().text,
            type: typeToString(u.getRightType()),
          };
        }),
      },
      source: this.source,
    };
  }

  log() {
    console.log("// renders to texture " + this.outNum);
    console.log(this.source);
  }
}

export interface MappedLeaf {
  map: ParamScope | null;
  leaf: SourceLeaf;
}

/** simple wrapper for named arguments */
interface NamedArg {
  id: Token;
  expr: Expr;
}

function namedArgsToJson(args: (NamedArg | Expr)[]) {
  return args.map((a) =>
    a instanceof Expr ? a.toJson() : { name: a.id.text, expr: a.expr.toJson() }
  );
}

function namedArgsToTypes(args: (NamedArg | Expr)[], scope: LexicalScope) {
  return args.map((a) =>
    a instanceof Expr ? a.getType(scope) : a.expr.getType(scope)
  );
}

function translateFrag(frag: Frag, sl: MappedLeaf) {
  const posString =
    frag.pos !== null
      ? frag.pos.translate(sl)
      : (() => {
          sl.leaf.requires.res = true;
          return "gl_FragCoord.xy/uResolution";
        })();

  if (typeof frag.sampler === "number") {
    sl.leaf.requires.samplers.add(frag.sampler);
    return `texture(uSampler${frag.sampler},${posString})`;
  } else if (frag.sampler === null) {
    sl.leaf.requires.samplers.add(sl.leaf.inNum);
    return `texture(uSampler${sl.leaf.inNum},${posString})`;
  } else if (frag.sampler instanceof IdentExpr) {
    const conversion = convertToSampler(frag.sampler, sl);
    return `texture(${
      typeof conversion === "string" ? conversion : conversion.translate(sl)
    },${posString})`;
  }
  throw new Error("sampler matched none of the cases");
}

function convertToSampler(expr: Expr, sl: MappedLeaf): Expr | string {
  // null will have compile time int used cached resolve
  const int = compileTimeInt(expr, null);
  if (int === null) return expr;
  const num = int === -1 ? sl.leaf.inNum : int;
  sl.leaf.requires.samplers.add(num);
  return "uSampler" + num;
}

export function compileTimeInt(
  expr: Expr,
  scope: LexicalScope | IdentResult | null // TODO get rid of IdentResult
) {
  if (expr instanceof IntExpr) return parseInt(expr.getToken().text);
  if (
    expr instanceof UnaryExpr &&
    expr.argument instanceof IntExpr &&
    ["+", "-"].includes(expr.operator.text)
  ) {
    return parseInt(expr.operator.text + expr.argument.getToken());
  }

  if (expr instanceof IdentExpr) {
    const res =
      scope instanceof LexicalScope
        ? scope.resolve(expr.getToken().text)
        : scope === null
        ? expr.cachedResolve
        : undefined;

    /*
    if (scope === undefined) {
      throw new Error("scope result was null and expr was not an int or unary");
    }
    */

    if (res instanceof TopDef && res.expr instanceof IntExpr) {
      return parseInt(res.expr.getToken().text);
    }
  }
  return null;
}

export function compileTimeParam(
  expr: Expr,
  scope: LexicalScope | IdentResult // TODO make this just lexical scope
) {
  if (expr instanceof IdentExpr) {
    const res =
      scope instanceof LexicalScope
        ? scope.resolve(expr.getToken().text)
        : scope;

    if (res instanceof Param) {
      expr.cachedParam = res;
      expr.validLVal = "invalid"; // TODO might not need this?
      return res;
    }
  }
  return null;
}

export function typeCheckExprStmts(
  arr: ExSt[],
  scope: LexicalScope,
  atRenderLevel = false
): void {
  const errors: TinslLineError[] = [];
  for (const e of arr) {
    try {
      if (e instanceof Expr) {
        const typ = e.getType(scope);

        if (atRenderLevel && typ !== "vec4" && typ !== "__undecided") {
          // TODO this is weird
          const throwCallback = () => {
            throw new TinslError(
              "expressions must be of type vec4 in render blocks and procedures. " +
                "type of expression was " +
                typeToString(typ)
            );
          };
          wrapErrorHelper(throwCallback, e, scope);
        }
      } else {
        e.typeCheck(scope);
      }
    } catch (e) {
      if (e instanceof TinslLineError) {
        errors.push(e);
      } else if (e instanceof TinslAggregateError) {
        errors.push(...e.errors);
      } else {
        throw e;
      }
    }
  }

  if (errors.length > 0) throw new TinslAggregateError(errors);
}

function commaSeparatedNodes(exprs: (Node | string)[], sl: MappedLeaf) {
  return exprs.map((s) => (s instanceof Node ? s.translate(sl) : s)).join();
}

function semicolonSeparatedNodes(exprs: Node[], sl: MappedLeaf) {
  return "\n" + exprs.map((s) => s.translate(sl)).join(";\n") + ";";
}

interface RenderLevel {
  cachedRefresh?: boolean;
  containsRefresh(): boolean;
}

function containsRefreshHelper<T extends RenderLevel>(
  procOrRender: T,
  body: ExSt[]
): boolean {
  if (procOrRender.cachedRefresh !== undefined)
    return procOrRender.cachedRefresh;
  let refresh = false;
  for (const e of body) {
    refresh ||=
      e instanceof Refresh ||
      ((e instanceof RenderBlock || e instanceof ProcCall) &&
        e.containsRefresh());
  }
  procOrRender.cachedRefresh = refresh;
  return refresh;
}

abstract class Node {
  abstract toJson(): object;
  abstract translate(sl: MappedLeaf): string;
  abstract getToken(): Token;
  toString() {
    return JSON.stringify(this.toJson());
  }
}

type IdentResult = TopDef | VarDecl | FuncDef | ProcDef | Param | Uniform;

interface IdentDictionary {
  [key: string]: IdentResult | undefined;
}

export class LexicalScope {
  private upperScope?: LexicalScope;
  private idents: IdentDictionary = {};
  private _returnType?: SpecType;
  private _funcName?: string; // TODO rename this (could be proc)
  private _funcDef?: FuncDef; // will only be defined within a func
  private _renderBlock?: RenderBlock; // will only be defined within a rb

  constructor(
    upperScope?: LexicalScope,
    returnType?: SpecType,
    funcName?: string,
    funcDef?: FuncDef,
    renderBlock?: RenderBlock
  ) {
    this.upperScope = upperScope;
    this._returnType = returnType ?? upperScope?._returnType;
    this._funcName = funcName ?? upperScope?._funcName;
    this._funcDef = funcDef ?? upperScope?.funcDef;
    this._renderBlock = renderBlock ?? upperScope?.renderBlock;
  }

  get returnType(): SpecType | undefined {
    return this._returnType;
  }

  set returnType(typ: SpecType | undefined) {
    this._returnType = typ;
    if (this.upperScope === undefined) return;
    this.upperScope.returnType = typ;
  }

  get funcName(): string | undefined {
    return this._funcName;
  }

  set funcName(str: string | undefined) {
    this._funcName = str;
  }

  get funcDef(): FuncDef | undefined {
    return this._funcDef;
  }

  set funcDef(def: FuncDef | undefined) {
    this._funcDef = def;
  }

  get renderBlock(): RenderBlock | undefined {
    return this._renderBlock;
  }

  set renderBlock(block: RenderBlock | undefined) {
    this._renderBlock = block;
  }

  addToScope(name: string, result: IdentResult, msg = "duplicate") {
    if (this.idents[name] !== undefined) {
      throw new TinslError(`${msg} identifier "${name}"`);
    }
    this.idents[name] = result;
  }

  addTexNum(int: number) {
    if (this.renderBlock !== undefined) {
      this.renderBlock.requiredTexNums.add(int);
    } else if (this.funcDef !== undefined) {
      this.funcDef.requiredTexNums.add(int);
    } else {
      throw Error(
        "both func def and render block of scope " +
          "were null when trying to add new required tex num"
      );
    }
  }

  addNeedsOneMult() {
    if (this.renderBlock !== undefined) {
      this.renderBlock.needsOneMult = true;
    } else if (this.funcDef !== undefined) {
      this.funcDef.needsOneMult = true;
    } else {
      throw Error(
        "both func def and render block of scope " +
          "were null when trying to add needs one mult"
      );
    }
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
    scope: LexicalScope,
    renderLevel = false,
    extraExSts: ExSt[] = [],
    innerScope = scope
  ): void {
    return wrapErrorHelper(
      callback,
      this,
      scope,
      renderLevel,
      extraExSts,
      innerScope
    );
  }
}

type Validity = "valid" | "const" | "final" | "invalid";

export abstract class Expr extends Node {
  cachedType?: SpecType;

  abstract getType(
    scope?: LexicalScope,
    associatedParam?: "sampler" | "normal" | Param
  ): SpecType;
  abstract getSubExpressions(): Expr[];
  isConst(scope: LexicalScope): boolean {
    return this.getSubExpressions().every((e) => e.isConst(scope));
  }

  isLVal(): Validity {
    return "invalid";
  }

  wrapError(
    callback: (scope: LexicalScope) => SpecType,
    scope: LexicalScope,
    renderLevel = false,
    extraExSts: ExSt[] = [],
    innerScope = scope,
    suppressReturningCached = false
  ): SpecType {
    if (this.cachedType !== undefined && !suppressReturningCached) {
      return this.cachedType;
    }
    this.cachedType = wrapErrorHelper(
      callback,
      this,
      scope,
      renderLevel,
      extraExSts,
      innerScope
    );
    return this.cachedType;
  }
}

export type ExSt = Expr | Stmt;

function isOnlyNamed(args: (NamedArg | Expr)[]): args is NamedArg[] {
  return args.every((a) => !(a instanceof Expr));
}

// checking that undefined is not included is needed for "empty elements"

export function isOnlyExpr(args: any[]): args is Expr[] {
  return args.every((a) => a instanceof Expr) && !args.includes(undefined);
}

export function isOnlyRenderBlock(args: any[]): args is RenderBlock[] {
  return (
    args.every((a) => a instanceof RenderBlock) && !args.includes(undefined)
  );
}

// TODO could these be generic?
export function isOnlyScopedExpr(
  args: ParamScoped<any>[]
): args is ParamScoped<Expr>[] {
  return args.every((a) => a.inmost() instanceof Expr);
}

export function isOnlyScopedRenderBlock(
  args: ParamScoped<any>[]
): args is ParamScoped<RenderBlock>[] {
  return args.every((a) => a.inmost() instanceof RenderBlock);
}

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

  /*
  addInDefaults(named: (NamedArg | Expr)[]) {
    const defaultStartIndex = named.length;
    // fill in the missing arguments
    for (let i = defaultStartIndex; i < this.params.length; i++) {
      const def = this.params[i].def;
      if (def === null) {
        throw Error("null default while trying to fill in defaults");
      }
      named.push(def);
    }
  }
  */

  // TODO function to get filled in names and defaults

  fillInNamedAndDefaults(
    args: (NamedArg | Expr)[]
    //scope?: LexicalScope
  ): Expr[] {
    let paddedArgs: (Expr | undefined)[];

    if (args.length > this.params.length) {
      throw new TinslError("too many arguments");
    }

    if (isOnlyExpr(args)) {
      paddedArgs = arrayPad(args, this.params.length, undefined);
    } else if (isOnlyNamed(args)) {
      if (arrHasRepeats(args.map((a) => a.id.text)))
        throw new TinslError("repeated name in named argument call");

      const paramNames = this.params.map((p) => p.getToken().text);
      const filledArgs: (Expr | undefined)[] = [];

      for (const arg of args) {
        const name = arg.id.text;
        const index = paramNames.indexOf(name);
        // TODO name the function in the error message
        if (index === -1) {
          throw new TinslError(`named argument "${name}" does not exist`);
        }
        filledArgs[index] = arg.expr;
      }

      // this turns the empty items into undefined
      paddedArgs = arrayPad([...filledArgs], this.params.length, undefined);
    } else {
      throw new TinslError(
        "call contained a mix of named and unnamed arguments"
      );
    }

    const ret = paddedArgs.map((p, i) => {
      if (p !== undefined) return p;
      const def = this.params[i].def;
      if (def === null) {
        throw new TinslError(
          `required argument for "${
            this.params[i].getToken().text
          }" not filled in`
        );
      }
      return def;
    });

    return ret;
  }

  validateDefaultParams(scope: LexicalScope) {
    // note: doesn't evaluate compile time int

    // TODO aggregate
    const defaults = []; // TODO cache this for the translator?

    let trailBegun = false;
    for (const p of this.params) {
      if (p.def !== null) {
        trailBegun = true;
        defaults.push(p);
      } else if (trailBegun) {
        throw new TinslError("default params must be trailing");
      }
    }

    for (const d of defaults) {
      if (d.def === null) throw new Error("default param def somehow null");

      const defType = d.def.getType(scope);
      const paramType = d.typ;

      // ignore undecided default values
      if (defType === "__undecided") continue;

      if (!compareTypes(paramType.toSpecType(), defType)) {
        throw new TinslError(`type of default value "${d.getToken()}" is \
of type ${typeToString(paramType.toSpecType())}, but expression for default \
is of type ${typeToString(defType)}`);
      }
    }
  }

  argsValid(args: (Expr | NamedArg)[], scope: LexicalScope): void {
    const exprArgs = this.fillInNamedAndDefaults(args);

    const kind = this instanceof ProcDef ? "procedure" : "function";
    const name = this.getToken().text;
    const defaultsNum = this.params.filter((p) => p.def !== null).length;

    const err = (str: string) =>
      new TinslError(`too ${str} arguments for ${kind} call "${name}"`);

    const paramTypes = this.params.map((p) => p.getRightType());
    const argTypes = exprArgs.map((a, i) => a.getType(scope, this.params[i]));

    // number of arguments <= to number of params because of defaults
    for (let i = 0; i < argTypes.length; i++) {
      if (argTypes[i] === "__undecided") continue;
      if (paramTypes[i] !== argTypes[i]) {
        throw new TinslError(
          `argument ${i} has wrong type. is ${argTypes[i]} \
but needs to be ${paramTypes[i]} for ${kind} call "${name}"`
        );
      }

      if (this.params[i].pureInt) {
        // input must be compile time
        const int = compileTimeInt(exprArgs[i], scope);
        const paramExpr = compileTimeParam(exprArgs[i], scope);

        if (paramExpr !== null) {
          // pure int status gets passed onto outer param
          paramExpr.pureInt = true; // this param is from the arg
          paramExpr.isTexNum = this.params[i].isTexNum;
        } else if (int === null) {
          // both were null so it's not compile time
          throw new TinslError(
            `in function "${this.getToken().text}", argument for parameter "${
              this.params[i].getToken().text
            }" is not a compile time atomic int, ${atomicIntHint}`
          );
        } else if (this.params[i].isTexNum) {
          // we know this is a texture number so sick it on either the render
          // block or the function def, whichever we are in
          scope.addTexNum(int);
        }
      }
    }
  }
}

function branchContainsReturn(exSts: ExSt[]) {
  return exSts.some(
    (e) => e instanceof Return || (e instanceof If && e.returnsInBoth())
  );
}

// TODO this class isn't particularly necessary
export class TinslProgram {
  topScope: LexicalScope = new LexicalScope();
  body: ExSt[];

  constructor(body: ExSt[]) {
    this.body = body;
  }

  check(): void {
    typeCheckExprStmts(this.body, this.topScope);
  }

  // TODO get rid of this
  getAllRenderBlocks(): RenderBlock[] {
    return this.body.filter((e): e is RenderBlock => e instanceof RenderBlock);
  }
}

interface Encompassing {
  needsOneMult: boolean;
  requiredTexNums: Set<number>;
}

export class RenderBlock extends Stmt implements Encompassing {
  cachedRefresh?: boolean;
  paramMappings: Map<Param, Expr> = new Map();
  requiredTexNums: Set<number> = new Set();
  needsOneMult = false;

  scopedBody: ParamScoped<ExSt>[] = [];

  constructor(
    public once: boolean,
    readonly body: ExSt[],
    public inNum: number | Expr | null,
    public outNum: number | Expr | null,
    public loopNum: number | Expr | null,
    public open: Token
  ) {
    super();
  }

  // TODO get rid of this
  containsRefresh(): boolean {
    return containsRefreshHelper(this, this.body);
  }

  /** creates a copy but sets the loop num to 1 */
  innerCopy(scopedBody: ParamScoped<ExSt>[]): RenderBlock {
    // it's okay for it to be a shallow copy
    const rb = new RenderBlock(
      this.once,
      [],
      this.inNum,
      this.outNum,
      1,
      this.open
    );
    rb.cachedRefresh = this.cachedRefresh;
    rb.paramMappings = this.paramMappings;
    rb.requiredTexNums = this.requiredTexNums;
    rb.scopedBody = scopedBody;
    return rb;
  }

  toJson(): object {
    return {
      name: "render_block",
      in: this.inNum instanceof Expr ? this.inNum.toJson() : this.inNum,
      out: this.outNum instanceof Expr ? this.outNum.toJson() : this.outNum,
      once: this.once,
      loop: this.loopNum instanceof Expr ? this.loopNum.toJson() : this.loopNum,
      body: this.body.map((e) => e.toJson()),
    };
  }

  translate(): string {
    // TODO reconsider whether rb is stmt
    throw new Error("cannot call translate on rb directly (use ir)");
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
    const innerScope = new LexicalScope(
      scope,
      undefined, // skip everything, just pass in render block
      undefined,
      undefined,
      this
    );

    this.wrapError(
      (scope: LexicalScope) => {
        const checkNum = (num: number | Expr | null, str: string) => {
          if (num === null || typeof num === "number") return num;

          const int = compileTimeInt(num, scope);
          if (int !== null) return int;

          const param = compileTimeParam(num, scope);
          if (param !== null && param.getRightType() === "int") {
            param.pureInt = true;
            param.usage = "sampler";
            return num;
          }

          throw new TinslError(`expression for ${str} number in render block \
is not a compile time atomic int, ${atomicIntHint}`);
        };

        // TODO aggregate these errors
        this.inNum = checkNum(this.inNum, "source texture");
        this.outNum = checkNum(this.outNum, "destination texture");
        this.loopNum = checkNum(this.loopNum, "loop");
      },
      scope,
      true,
      this.body,
      innerScope
    );
  }
}

export class BinaryExpr extends Expr {
  left: Expr;
  operator: Token;
  right: Expr;
  isLeftHand = false; // TODO do we need this?
  isLengthAccess = false;
  private validLVal?: Validity;

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

  translate(sl: MappedLeaf) {
    return `(${this.left.translate(sl)}${
      this.operator.text
    }${this.right.translate(sl)})`;
  }

  getType(scope: LexicalScope): SpecType {
    return this.wrapError(() => {
      const lType = this.left.getType(scope);
      const op = this.operator.text;

      // dots can only act on vecs for now (no structs)
      if (this.operator.text === ".") {
        if (lType === "__undecided") return "__undecided";
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

        const ret = vectorAccessTyping(this.right.getToken().text, lType);

        // can't be an l-value if the swizzle contains repeats
        if (strHasRepeats(this.right.getToken().text)) {
          this.validLVal = "invalid";
        }

        if (this.validLVal !== "invalid") {
          this.validLVal = this.left.isLVal();
        }

        return ret;
      }

      this.validLVal = "invalid";

      return binaryTyping(op, lType, this.right.getType(scope));
    }, scope);
  }

  isLVal(): Validity {
    if (this.validLVal === undefined) {
      throw new Error(
        "undefined is valid l-value for binary expression. called before getType()?"
      );
    }

    return this.validLVal;
  }
}

export class UnaryExpr extends Expr {
  operator: Token;
  argument: Expr; // TODO rename
  postfix: boolean;

  constructor(operator: Token, argument: Expr, postfix = false) {
    super();
    this.operator = operator;
    this.argument = argument;
    this.postfix = postfix;
  }

  getSubExpressions() {
    return [this.argument];
  }

  getToken() {
    return this.operator;
  }

  translate(sl: MappedLeaf) {
    return this.postfix
      ? `(${this.argument.translate(sl)}${this.operator})`
      : `(${this.operator}${this.argument.translate(sl)})`;
  }

  toJson() {
    return {
      name: "unary_expr",
      operator: this.operator.text,
      argument: this.argument.toJson(),
      fix: this.postfix ? "postfix" : "prefix",
    };
  }

  getType(scope: LexicalScope): SpecType {
    return this.wrapError(() => {
      const argType = this.argument.getType(scope);

      // ++ and -- need to be treated like assignment, so l-value required
      if (
        ["++", "--"].includes(this.operator.text) &&
        this.argument.isLVal() !== "valid"
      ) {
        throw new TinslError(lValueHint(this.argument.isLVal()));
      }

      return unaryTyping(this.operator.text, argType);
    }, scope);
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

  translate(sl: MappedLeaf) {
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
  validLVal?: Validity;
  cachedParam?: Param;
  cachedResolve?: IdentResult;

  toJson() {
    return this.jsonHelper("ident_expr");
  }

  getType(
    scope?: LexicalScope,
    associatedParam: "sampler" | "normal" | Param = "normal"
  ): SpecType {
    // this can't return the cached type; it needs to do this check every time
    // or else sampler/normal won't work. but when we are translating we just
    // want the cached type. (TODO think about if there's a better way)
    if (scope === undefined) {
      if (this.cachedType === undefined) {
        throw new Error(
          "cached type was undefined when getting type for translation"
        );
      }
      return this.cachedType;
    }
    return this.wrapError(
      () => {
        // invalid until set otherwise
        this.validLVal = "invalid";

        const name = this.getToken().text;
        const res = scope.resolve(name);
        if (res === undefined)
          throw new TinslError(`undefined identifier "${name}"`);

        const helper = (str: string) => {
          return new TinslError(
            `identifier ${name} is a ${str} definition, not an expression`
          );
        };

        if (res instanceof FuncDef) throw helper("function");
        if (res instanceof ProcDef) throw helper("procedure");

        if (res instanceof VarDecl) {
          this.validLVal = res.access === "mut" ? "valid" : res.access;
        } else if (res instanceof Param) {
          const requiredMatch =
            associatedParam instanceof Param
              ? associatedParam.usage
              : associatedParam;

          if (res.usage !== "unused" && res.usage !== requiredMatch) {
            throw new TinslError(
              `param has mixed use. ${requiredMatch} & ${res.usage}`
            );
          }
          res.usage = requiredMatch;
          // parameters are immutable by default
        }

        this.cachedResolve = res;

        return res.getRightType(scope);
      },
      scope,
      undefined,
      undefined,
      undefined,
      true
    );
  }

  translate(sl: MappedLeaf) {
    if (this.cachedResolve instanceof Uniform) {
      sl.leaf.requires.uniforms.add(this.cachedResolve);
    } else if (this.cachedResolve instanceof TopDef) {
      return this.cachedResolve.translate(sl);
    } else if (
      this.cachedResolve instanceof Param &&
      sl.map !== null
      //sl.map.get(this.cachedResolve) // TODO! take a look at this
    ) {
      /*
      if (sl.map === null) {
        throw new Error("map was null");
      }
      */
      const mapping = sl.map.get(this.cachedResolve);
      if (mapping === null) throw new Error("param mapping null");
      if (this.cachedResolve.usage === "sampler") {
        const ret = convertToSampler(mapping, sl);
        return typeof ret === "string" ? ret : ret.translate(sl);
      }
      return mapping.translate(sl);
    }
    return this.value.text;
  }

  isConst(scope: LexicalScope): boolean {
    const name = this.getToken().text;
    const res = scope.resolve(name);
    return (
      (res instanceof VarDecl && res.access === "const") ||
      (res instanceof TopDef && res.expr.isConst(scope))
    );
  }

  isLVal() {
    if (this.validLVal === undefined) {
      throw new Error(
        "undefined is valid l-value for ident. called before getType()?"
      );
    }

    return this.validLVal;
  }
}

export class CallExpr extends Expr {
  open: Token;
  call: Expr;
  args: (Expr | NamedArg)[];

  userDefinedFuncDef?: FuncDef;

  constructor(open: Token, call: Expr, args: (Expr | NamedArg)[]) {
    super();
    this.open = open;
    this.call = call;
    this.args = args;
  }

  getSubExpressions(): Expr[] {
    return this.args.map((e) => (e instanceof Expr ? e : e.expr));
  }

  getToken(): Token {
    return this.open;
  }

  translate(sl: MappedLeaf): string {
    if (this.call instanceof Frag) return translateFrag(this.call, sl);

    let argString = "";
    if (this.userDefinedFuncDef !== undefined) {
      const filledArgs = this.userDefinedFuncDef.fillInNamedAndDefaults(
        this.args
      );
      // convert -1 calls to outer num
      const params = this.userDefinedFuncDef.params;
      const convertedToSamplers = filledArgs.map((a, i) =>
        params[i].usage === "sampler"
          ? (() => {
              return convertToSampler(a, sl);
            })()
          : a
      );
      argString = commaSeparatedNodes(convertedToSamplers, sl);
    } else {
      argString = commaSeparatedNodes(this.getSubExpressions(), sl);
    }

    return `${this.call.translate(sl)}(${argString})`;
  }

  toJson(): object {
    return {
      name: "call_expr",
      call: this.call.toJson(),
      args: namedArgsToJson(this.args),
    };
  }

  getType(scope: LexicalScope): SpecType {
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
        if (this.args.length === 0) {
          throw new TinslError(
            "can not call frag with no arguments. just use `frag` on its own"
          );
        }

        const fragExpr = this.call;

        const helper = (typ: SpecTypeSimple) => {
          if (!isOnlyExpr(this.args)) {
            throw new TinslError("frag call cannot contain named args");
          }

          const list = this.args.filter(
            (x) => x.getType(scope, "sampler") === typ
          );

          if (list.length > 1) {
            throw new TinslError(
              `cannot have more than one ${typ} as an argument to "frag"`
            );
          }

          return list.length === 1 ? list[0] : null;
        };

        const intExpr = helper("int");

        if (fragExpr.sampler !== null && intExpr !== null) {
          throw new TinslError(
            "sampler number already defined in the identifier name; " +
              "cannot also be passed in as an argument. sampler: " +
              fragExpr.sampler
          );
        }

        if (intExpr !== null) {
          const int = compileTimeInt(intExpr, scope);
          if (int === null) {
            // wasn't a direct param
            const param = compileTimeParam(intExpr, scope);
            if (param === null) {
              throw new TinslError(
                "sampler number for frag has to be a compile time atomic int, " +
                  atomicIntHint
              );
            }

            param.pureInt = true;
            param.isTexNum = true;
            //param.usage = "sampler";
            fragExpr.sampler = intExpr;
          } else {
            fragExpr.sampler = int;
            scope.addTexNum(int);
          }
        }

        const vec2 = helper("vec2");
        fragExpr.pos = vec2;

        // TODO might have to change if we support different texture types
        return "vec4";
      }

      if (!(this.call instanceof IdentExpr)) {
        throw new TinslError("invalid function call");
      }

      const name = this.call.getToken().text;

      if (name === scope.funcName) {
        throw new TinslError(`recursive call to "${name}" is not allowed`);
      }

      const info = builtIns[name];
      if (info !== undefined) {
        return callReturnType(namedArgsToTypes(this.args, scope), info, name);
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

      // add itself to the set of sub functions in the outer function
      if (scope.funcDef !== undefined) {
        scope.funcDef.subFuncs.add(res);
      }

      // make sure all the argument types match the param types
      res.argsValid(this.args, scope);
      this.userDefinedFuncDef = res;
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

  translate(sl: MappedLeaf): string {
    return `${this.typ.translate()}(${commaSeparatedNodes(this.args, sl)})`;
  }

  toJson(): object {
    return {
      name: "constructor_expr",
      typ: this.typ.toJson(),
      args: this.args.map((e) => e.toJson()),
    };
  }

  getType(scope: LexicalScope): SpecType {
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

  isLVal(): Validity {
    return "invalid";
  }
}

export class SubscriptExpr extends Expr {
  private multsByOne = false;

  constructor(public open: Token, public call: Expr, public index: Expr) {
    super();
  }

  getSubExpressions(): Expr[] {
    return [this.index];
  }

  getToken(): Token {
    return this.open;
  }

  translate(sl: MappedLeaf): string {
    return `${this.call.translate(sl)}[${
      this.multsByOne
        ? (this.index.getType() === "int" ? "int_" : "uint_") +
          NON_CONST_ID +
          "*"
        : ""
    }(${this.index.translate(sl)})]`;
  }

  toJson(): object {
    return {
      name: "subscript_expr",
      call: this.call.toJson(),
      index: this.index,
    };
  }

  getType(scope: LexicalScope): SpecType {
    return this.wrapError(() => {
      const callType = this.call.getType(scope);

      if (callType === "__undecided") return "__undecided";

      const indexType = this.index.getType(scope);
      if (!(indexType === "int" || indexType === "uint")) {
        throw new TinslError("index must be an integer");
      }

      // TODO pass in scope instead of null?
      const intResult = compileTimeInt(this.index, null);

      if (intResult !== null) {
        if (!isInIndexableRange(callType, intResult)) {
          throw new TinslError(`index ${intResult} out of range`);
        }
      } else if (this.index.isConst(scope)) {
        // if it's a const expr, then we can't fully evaluate; we multiply by
        // non-const 1 when generating code
        console.log("needs one mult index", this.index);
        scope.addNeedsOneMult();
        this.multsByOne = true;
      }

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

      return callType.typ;
    }, scope);
  }

  isLVal() {
    return this.call.isLVal();
  }
}

type Access = "mut" | "const" | "final";

export class VarDecl extends Stmt {
  constructor(
    public access: Access,
    public typ: TypeName | null,
    public id: Token,
    public expr: Expr,
    public assign: Token
  ) {
    super();
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

  translate(sl: MappedLeaf): string {
    return (
      (this.access === "const" ? "const " : "") +
      typeToString(this.getRightType()) +
      " " +
      this.id.text +
      (this.assign.text === ":=" ? "=" : this.assign.text) +
      this.expr.translate(sl)
    );
  }

  getToken(): Token {
    return this.id;
  }

  typeCheck(scope: LexicalScope): void {
    const errors: (TinslLineError | TinslAggregateError)[] = [];

    aggregateIdentError(errors, this.id.text, scope, this);

    try {
      this.wrapError((scope: LexicalScope) => {
        scope.addToScope(this.id.text, this, "redefinition of");
        if (this.access === "const" && !this.expr.isConst(scope)) {
          // TODO throw the invalid l-value error helper instead
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
    } catch (err) {
      if (err instanceof TinslLineError || err instanceof TinslAggregateError) {
        errors.push(err);
      } else {
        throw err;
      }
    }

    aggregateFromErrors(errors);
  }

  getRightType(scope?: LexicalScope) {
    // TODO this is the same as top def
    try {
      return this.expr.getType(scope);
    } catch (err) {
      return "__undecided";
    }
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

  translate(sl: MappedLeaf): string {
    return `${this.left.translate(sl)}${this.assign.text}${this.right.translate(
      sl
    )}`;
  }

  getToken(): Token {
    return this.assign;
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      const leftType = this.left.getType(scope);
      const rightType = this.right.getType(scope);

      if (this.left.isLVal() !== "valid") {
        throw new TinslError(lValueHint(this.left.isLVal()));
      }

      const assign = this.assign.text;

      // should safely ignore <= and >= since they'll get parsed as binary
      if (assign.length > 1) {
        const op = assign.substr(0, assign.length - 1);
        try {
          binaryTyping(op, leftType, rightType);
        } catch (err) {
          if (err instanceof TinslError) {
            throw new TinslError(`for assignment op ${assign}: ` + err.message);
          }
          throw err;
        }
        return;
      }

      if (!compareTypes(leftType, rightType)) {
        throw new TinslError(
          `left side of assignment was ${typeToString(
            leftType
          )} but right side expression was ${typeToString(rightType)}`
        );
      }
    }, scope);
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
    return typeToString(this.toSpecType());
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
  def: Expr | null;
  pureInt = false;
  /** null means it does not indicate a texture num */
  isTexNum = false; // TODO get rid of this; covered by the next attribute
  usage: "normal" | "sampler" | "unused" = "unused";

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
    return `${this.usage === "sampler" ? "sampler2D" : this.typ.translate()} ${
      this.id.text
    }`;
  }

  getToken(): Token {
    return this.id;
  }

  getRightType(): SpecType {
    return this.typ.toSpecType();
  }
}

export class FuncDef extends DefLike implements Encompassing {
  typ: TypeName | null;
  id: Token;
  body: ExSt[];
  private inferredType?: SpecType;

  subFuncs: Set<FuncDef> = new Set();

  requiredTexNums: Set<number> = new Set();

  needsOneMult = false;

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

  translate(sl: MappedLeaf): string {
    if (this.inferredType === undefined && this.typ === null) {
      throw new Error("inferred type and explicit type were both not set");
    }

    const typeString =
      this.inferredType !== undefined
        ? typeToString(this.inferredType)
        : this.typ?.toSpecType();

    return `${typeString} ${this.id.text}(${commaSeparatedNodes(
      this.params,
      sl
    )}){${semicolonSeparatedNodes(this.body, sl)}}\n`;
  }

  getToken(): Token {
    return this.id;
  }

  getExprStmts(): ExSt[] {
    return this.body;
  }

  typeCheck(scope: LexicalScope): void {
    const innerScope = new LexicalScope(scope);

    const retType = this.typ !== null ? this.typ.toSpecType() : undefined;
    const funcName = this.getToken().text;

    innerScope.funcName = funcName;
    innerScope.returnType = retType;
    innerScope.funcDef = this;

    const errors: (TinslLineError | TinslAggregateError)[] = [];

    aggregateIdentError(errors, this.id.text, scope, this);

    for (const p of this.params) {
      aggregateIdentError(errors, p.getToken().text, scope, this);
    }

    // this is done in a separate step so it adds the symbol even when there is
    // no branch, avoiding unwarranted "undefined identifier" errors
    try {
      this.wrapError(
        () => {
          if (!branchContainsReturn(this.body)) {
            throw new TinslError(
              `function "${
                this.getToken().text
              }" does not definitely return a value. this may be because it does \
not contain a return statement in all conditional branches`
            );
          }
        },
        scope,
        false
      );
    } catch (err) {
      if (err instanceof TinslLineError || err instanceof TinslAggregateError) {
        errors.push(err);
      } else {
        throw err;
      }
    }

    const wrap = () => {
      return this.wrapError(
        (scope: LexicalScope) => {
          // add to scope even if type is possibly not able to be inferred
          scope.addToScope(this.getToken().text, this);

          // null means it is an 'fn' function
          if (this.typ !== null) {
            const ret = this.typ.toSpecType();
            if (typeof ret === "object" && ret.size === 0) {
              throw new TinslError(`functions that return an array must have \
a defined size in the return type specifier`);
            }
          }

          // add all the params to the scope
          for (const p of this.params) {
            innerScope.addToScope(p.getToken().text, p);
          }

          this.validateDefaultParams(scope);
        },
        scope,
        false,
        this.body,
        innerScope
      );
    };

    try {
      wrap();
    } catch (err) {
      if (err instanceof TinslLineError || err instanceof TinslAggregateError) {
        errors.push(err);
      } else {
        throw err;
      }
    } finally {
      this.inferredType = innerScope.returnType ?? "__undecided";
    }

    aggregateFromErrors(errors);
  }

  getReturnType(): SpecType {
    if (this.inferredType !== undefined) return this.inferredType;
    throw new Error(
      "inferred type was null (possibly called before typeCheck)"
    );
  }

  getAllNestedFunctionDeps(set: Set<FuncDef> = new Set()): Set<FuncDef> {
    for (const f of this.subFuncs) {
      set.add(f);
      f.getAllNestedFunctionDeps(set);
    }

    return set;
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

  translate(sl: MappedLeaf): string {
    return `return ${this.expr.translate(sl)}`;
  }

  getToken(): Token {
    return this.ret;
  }

  getExprStmts(): ExSt[] {
    return [this.expr];
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      const exprType = this.expr.getType(scope);
      if (scope.returnType === undefined) {
        scope.returnType = exprType;
        return;
      }

      if (compareTypes(this.expr.getType(scope), scope.returnType)) return;
      const oldRetType = scope.returnType;
      scope.returnType = "__undecided";
      // TODO better error message that includes name of function
      throw new TinslError(
        `function return type does not match. \
return expression was of type ${typeToString(exprType)} \
but the function should return ${typeToString(oldRetType)}`
      );
    }, scope);
  }
}

export class TernaryExpr extends Expr {
  constructor(
    public bool: Expr,
    public expr1: Expr,
    public expr2: Expr,
    public token: Token
  ) {
    super();
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

  translate(sl: MappedLeaf): string {
    return `(${this.bool.translate(sl)}?${this.expr1.translate(
      sl
    )}:${this.expr2.translate(sl)})`;
  }

  getToken(): Token {
    return this.token;
  }

  getType(scope: LexicalScope): SpecType {
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
  constructor(
    public init: ExSt | null,
    public cond: Expr | null,
    public loop: ExSt | null,
    public body: ExSt[],
    public token: Token
  ) {
    super();
  }

  getExprStmts() {
    return {
      outer: [
        ...(this.init ? [this.init] : []),
        ...(this.cond ? [this.cond] : []), // this isn't really used
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

  translate(sl: MappedLeaf): string {
    return `for(
${this.init !== null ? this.init.translate(sl) : ""};
${this.cond !== null ? this.cond.translate(sl) : ""};
${this.loop !== null ? this.loop.translate(sl) : ""}
){${semicolonSeparatedNodes(this.body, sl)}}`;
  }

  getToken(): Token {
    return this.token;
  }

  typeCheck(scope: LexicalScope): void {
    const innerScope = new LexicalScope(scope); // in for (...)
    const errors: TinslAggregateError[] = [];

    // we have to catch errors in two phases because of how the scoping works
    // for for loops, hence the two try blocks. this is a special case

    try {
      this.wrapError(
        () => {}, // pass in noop just to check the body
        scope, // doesn't matter
        false,
        [...(this.init ? [this.init] : []), ...(this.loop ? [this.loop] : [])],
        innerScope
      );
    } catch (err) {
      if (err instanceof TinslAggregateError) errors.push(err);
      else throw err;
    }

    const inMostScope = new LexicalScope(innerScope); // in body

    try {
      this.wrapError(
        (scope: LexicalScope) => {
          // this check has to be after checking the other expressions or else
          // cascading unknown identifier error
          if (this.cond !== null && this.cond.getType(scope) !== "bool") {
            throw new TinslError("conditional in a for loop must be a boolean");
          }
        },
        innerScope,
        false,
        this.getExprStmts().inner,
        inMostScope
      );
    } catch (err) {
      if (err instanceof TinslAggregateError) errors.push(err);
      else throw err;
    }

    if (errors.length > 0) {
      throw new TinslAggregateError(errors.map((e) => e.errors).flat());
    }
  }
}

export class If extends Stmt {
  constructor(
    public cond: Expr,
    public body: ExSt[],
    public token: Token,
    public cont: Else | null
  ) {
    super();
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

  translate(sl: MappedLeaf): string {
    return `if(${this.cond.translate(sl)}){${semicolonSeparatedNodes(
      this.body,
      sl
    )}
}${this.cont !== null ? this.cont.translate(sl) : ""}\n`;
  }

  getToken(): Token {
    return this.token;
  }

  typeCheck(scope: LexicalScope): void {
    const innerScope = new LexicalScope(scope);
    const errors: TinslAggregateError[] = [];

    try {
      this.wrapError(
        (scope: LexicalScope) => {
          if (this.cond.getType(scope) !== "bool") {
            throw new TinslError("if condition must be a boolean expression");
          }
        },
        scope,
        false,
        this.body,
        innerScope
      );
    } catch (err) {
      if (err instanceof TinslAggregateError) errors.push(err);
      else throw err;
    }

    try {
      const contScope = new LexicalScope(scope);
      this.wrapError(() => {
        this.cont?.typeCheck(contScope);
      }, contScope);
    } catch (err) {
      if (err instanceof TinslAggregateError) errors.push(err);
      else throw err;
    }

    if (errors.length > 0) {
      throw new TinslAggregateError(errors.map((e) => e.errors).flat());
    }
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
  constructor(public body: ExSt[], public token: Token) {
    super();
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

  translate(sl: MappedLeaf): string {
    return `else{${semicolonSeparatedNodes(this.body, sl)}\n}`;
  }

  getToken(): Token {
    return this.token;
  }

  typeCheck(scope: LexicalScope): void {
    const innerScope = new LexicalScope(scope);
    this.wrapError(
      // using a noop to just check the body
      () => {},
      scope,
      false,
      this.body,
      innerScope
    );
  }
}

// TODO check to see that length of array uniform is specified
export class Uniform extends Stmt {
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
    //sl.leaf.requires.uniforms.add(typeToString(this.typ.toSpecType()));
    // TODO does mediump have to be specified?
    const typ = typeToString(this.typ.toSpecType());
    return `uniform ${typ} ${this.ident.text};\n`;
  }

  getToken(): Token {
    return this.ident;
  }

  getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] } {
    return [];
  }

  typeCheck(scope: LexicalScope): void {
    scope.addToScope(this.ident.text, this);
  }

  getRightType() {
    try {
      return this.typ.toSpecType();
    } catch {
      return "__undecided";
    }
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
    const innerScope = new LexicalScope(scope);
    const errors: (TinslLineError | TinslAggregateError)[] = [];

    aggregateIdentError(errors, this.id.text, scope, this);

    for (const p of this.params) {
      aggregateIdentError(errors, p.getToken().text, scope, this);
    }

    try {
      this.wrapError(
        (scope: LexicalScope) => {
          scope.addToScope(this.getToken().text, this);
          for (const p of this.params) {
            innerScope.addToScope(p.getToken().text, p);
          }
          this.validateDefaultParams(scope);
        },
        scope,
        true,
        this.body,
        innerScope
      );
    } catch (err) {
      if (err instanceof TinslLineError || err instanceof TinslAggregateError) {
        errors.push(err);
      } else {
        throw err;
      }
    }

    aggregateFromErrors(errors);
  }
}

export class ProcCall extends Stmt implements RenderLevel {
  open: Token;
  call: IdentExpr;
  args: (Expr | NamedArg)[];
  cachedRefresh?: boolean;
  cachedProcDef?: ProcDef;

  constructor(open: Token, call: IdentExpr, args: (Expr | NamedArg)[]) {
    super();
    this.open = open;
    this.call = call;
    this.args = args;
  }

  // TODO might not need this since we expand procs into render blocks first
  containsRefresh(): boolean {
    if (this.cachedProcDef === undefined)
      throw new Error(
        "cached procedure somehow undefined when checking for refresh"
      );

    return containsRefreshHelper(this, this.cachedProcDef.body);
  }

  getExprStmts(): ExSt[] | { outer: ExSt[]; inner: ExSt[] } {
    return this.args.map((e) => (e instanceof Expr ? e : e.expr));
  }

  typeCheck(scope: LexicalScope): void {
    this.wrapError((scope: LexicalScope) => {
      const name = this.call.getToken().text;
      const res = scope.resolve(this.call.getToken().text);
      if (!(res instanceof ProcDef))
        throw new TinslError(
          `identifier "${name}" does not refer to a procedure definition`
        );
      this.cachedProcDef = res;
      res.argsValid(this.args, scope);
    }, scope);
  }

  toJson(): object {
    return {
      name: "proc_call",
      call: this.call.toJson(),
      args: namedArgsToJson(this.args),
    };
  }

  translate(): string {
    throw new Error("Method not implemented.");
  }

  getToken(): Token {
    return this.open;
  }

  getAllArgs(): Expr[] {
    if (this.cachedProcDef === undefined) {
      throw new Error("cached proc was undefined");
    }
    const filledArgs = this.cachedProcDef.fillInNamedAndDefaults(this.args);
    //this.cachedProcDef.addInDefaults(filledArgs);
    return filledArgs;
  }
}

export class TopDef extends Stmt {
  constructor(public id: Token, public expr: Expr) {
    super();
  }

  toJson(): object {
    return {
      name: "top_def",
      id: this.id.text,
      expr: this.expr,
    };
  }

  translate(sl: MappedLeaf): string {
    return this.expr.translate(sl);
  }

  getToken(): Token {
    return this.id;
  }

  getExprStmts(): ExSt[] {
    return [this.expr];
  }

  typeCheck(scope: LexicalScope): void {
    // TODO test type errors for top defs
    this.wrapError(() => {
      scope.addToScope(this.getToken().text, this);
      this.expr.getType(scope);
    }, scope);
  }

  getRightType(scope?: LexicalScope) {
    // TODO this is the same as in vardecl
    try {
      return this.expr.getType(scope);
    } catch (err) {
      return "__undecided";
    }
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

  getToken(): Token {
    return this.token;
  }

  isConst() {
    return false;
  }
}

// TODO should the default position be normalized?
// seems like the most common use case
export class Pos extends Basic {
  typ: SpecTypeSimple = "vec2";
  name: string = "pos";

  translate(sl: MappedLeaf): string {
    return "gl_FragCoord.xy";
  }
}

export class NPos extends Basic {
  typ: SpecTypeSimple = "vec2";
  name: string = "npos";

  translate(sl: MappedLeaf): string {
    sl.leaf.requires.res = true;
    return "(gl_FragCoord.xy / uResolution)";
  }
}

export class Res extends Basic {
  typ: SpecTypeSimple = "vec2";
  name: string = "res";

  translate(sl: MappedLeaf): string {
    sl.leaf.requires.res = true;
    return "uResolution";
  }
}

export class Time extends Basic {
  typ: SpecTypeSimple = "float";
  name: string = "time";

  translate(sl: MappedLeaf): string {
    sl.leaf.requires.time = true;
    return "uTime";
  }
}

export class Prev extends Basic {
  typ: SpecTypeSimple = "vec4";
  name: string = "prev";

  translate(sl: MappedLeaf): string {
    return "fragColor";
  }
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
    throw new Error("can't translate refresh");
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
  _sampler: number | Expr | null;
  pos: Expr | null = null;
  tokn: Token;

  constructor(tokn: Token) {
    super();
    const matches = tokn.text.match(/frag([0-9]+)*/);
    if (matches === null) throw new Error("frag matches was null");
    const num = matches[1];
    this._sampler = num === undefined ? null : parseInt(num);
    this.tokn = tokn;
  }

  get sampler() {
    return this._sampler;
  }

  set sampler(s: number | Expr | null) {
    this._sampler = s === -1 ? null : s;
  }

  getSubExpressions(): Expr[] {
    return [];
  }

  getType(scope: LexicalScope): SpecType {
    // TODO this might change if we support different texture types
    return "vec4";
  }

  toJson(): object {
    return {
      name: "frag",
      sampler:
        this.sampler instanceof Expr ? this.sampler.toJson() : this.sampler,
    };
  }

  translate(sl: MappedLeaf): string {
    return translateFrag(this, sl);
  }

  getToken(): Token {
    return this.tokn;
  }
}

export class ColorString extends Expr {
  str: string;
  id: Token;
  num: number | null;
  cachedColorVec?: number[];

  constructor(id: Token, num: number | null = null) {
    super();
    this.str = id.text.substr(1, id.text.length - 2);
    this.id = id;
    this.num = num;
  }

  getType(scope: LexicalScope): SpecType {
    return this.wrapError(() => {
      if (this.num !== null && this.num !== 3 && this.num !== 4) {
        throw new TinslError(
          "can only specify suffix number of 3 or 4 for color strings"
        );
      }

      const getColorVec = (): number[] => {
        const hexColor = hexColorToVector(this.str);
        if (hexColor !== undefined) return hexColor;

        const namedColor = colors[toColorKey(this.str)];

        if (namedColor === undefined) {
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
        }

        const namedColorHex = hexColorToVector(namedColor);

        if (namedColorHex === undefined) {
          throw new Error("named color had invalid hex");
        }

        return namedColorHex;
      };

      let colorVec = getColorVec();

      if (this.num !== undefined) {
        if (this.num === 3) colorVec = colorVec.slice(0, 3);
        else if (this.num === 4) colorVec = arrayPad(colorVec, 4, 1);
      }

      this.cachedColorVec = colorVec;
      return ("vec" + this.cachedColorVec.length) as SpecTypeSimple;
      // TODO tests for #fff and #ffff color hexes
    }, scope);
  }

  getSubExpressions(): Expr[] {
    return [];
  }

  toJson(): object {
    return { name: "color_string", str: this.str };
  }

  translate(): string {
    if (this.cachedColorVec === undefined) {
      throw new Error("cached color vec was undefined");
    }
    return `vec${this.cachedColorVec.length}(${this.cachedColorVec})`;
  }

  getToken(): Token {
    return this.id;
  }

  isConst(): boolean {
    return true;
  }
}
