import {
  CallExpr,
  Expr,
  FuncDef,
  isOnlyExpr,
  isOnlyRenderBlock,
  isOnlyScopedExpr,
  isOnlyScopedRenderBlock,
  Param,
  ParamScoped,
  RenderBlock,
  TopDef,
} from "./nodes";

interface LoopInfo {
  once: boolean;
  inNum: number;
  outNum: number;
  loopNum: number;
}

// IR classes are similar to render blocks but simpler, and narrow the types

export abstract class IRNode {
  loopInfo: LoopInfo;
  paramMappings: Map<Param, Expr>;

  constructor(loopInfo: LoopInfo, paramMappings: Map<Param, Expr>) {
    this.loopInfo = loopInfo;
    this.paramMappings = paramMappings;
  }
  //abstract print(): void;
}

export class IRTree extends IRNode {
  subNodes: (IRTree | IRLeaf)[];

  constructor(
    loopInfo: LoopInfo,
    paramMappings: Map<Param, Expr>,
    subNodes: (IRTree | IRLeaf)[]
  ) {
    super(loopInfo, paramMappings);
    this.subNodes = subNodes;
  }

  // TODO get rid of this or make it better
  /*
  print(): void {
    for (const s of this.subNodes) {
      s.print();
    }
  }
  */
}

export class IRLeaf extends IRNode {
  source = ""; // TODO get rid of this?

  constructor(
    loopInfo: LoopInfo,
    paramMappings: Map<Param, Expr>,
    public exprs: ParamScoped<Expr>[],
    public oneMult: boolean,
    public texNums: Set<number>
  ) {
    super(loopInfo, paramMappings);
  }

  /*
  print(): void {
    console.log("#" + JSON.stringify(this.loopInfo));
    console.log(this.source);
  }
  */
}

export function getAllUsedFuncs(
  exprs: Expr[],
  funcs: Set<FuncDef> = new Set()
) {
  for (const e of exprs) {
    // if it is a call expression and not a builtin or constructor, add it
    if (e instanceof CallExpr && e.userDefinedFuncDef !== undefined) {
      // get all nested function dependencies of this function, and add them
      funcs.add(e.userDefinedFuncDef);
      // tell the func def to add all of its dependencies to the set
      e.userDefinedFuncDef.getAllNestedFunctionDeps(funcs);
    }

    // do the same for all the sub expressions of each expression
    getAllUsedFuncs(e.getSubExpressions(), funcs);
  }

  return funcs;
}

export function renderBlockToIR(block: RenderBlock): IRTree | IRLeaf {
  if (
    typeof block.inNum !== "number" ||
    typeof block.outNum !== "number" ||
    block.loopNum instanceof Expr
  ) {
    console.log("innum", block.inNum, "outnum", block.outNum);
    throw new Error("a render block num was not a normal number");
  }

  const loopInfo: LoopInfo = {
    inNum: block.inNum,
    outNum: block.outNum,
    loopNum: block.loopNum ?? 1,
    once: block.once,
  };

  if (isOnlyScopedExpr(block.scopedBody)) {
    return new IRLeaf(
      loopInfo,
      block.paramMappings,
      //block.body,
      block.scopedBody,
      block.needsOneMult,
      block.requiredTexNums
    );
  }

  if (isOnlyScopedRenderBlock(block.scopedBody)) {
    return new IRTree(
      loopInfo,
      block.paramMappings,
      block.scopedBody.map((s) => s.inmost()).map(renderBlockToIR)
    );
  }

  console.log(block.scopedBody);

  throw new Error("render block contained mix of types");
}
