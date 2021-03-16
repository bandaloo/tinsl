import { Func } from "mocha";
import {
  CallExpr,
  Expr,
  FuncDef,
  isOnlyExpr,
  isOnlyRenderBlock,
  Param,
  RenderBlock,
  TopDef,
} from "./nodes";
import { extractTopLevel } from "./testhelpers";

interface LoopInfo {
  once: boolean;
  inNum: number;
  outNum: number;
  loopNum: number;
}

// IR classes are similar to render blocks but simpler, and narrow the types

export class IRNode {
  loopInfo: LoopInfo;
  paramMappings: Map<Param, Expr>;

  constructor(loopInfo: LoopInfo, paramMappings: Map<Param, Expr>) {
    this.loopInfo = loopInfo;
    this.paramMappings = paramMappings;
  }
}

export class IRTree extends IRNode {
  subNodes: IRNode[];

  constructor(
    loopInfo: LoopInfo,
    paramMappings: Map<Param, Expr>,
    subNodes: IRNode[]
  ) {
    super(loopInfo, paramMappings);
    this.subNodes = subNodes;
  }
}

export class IRLeaf extends IRNode {
  exprs: Expr[];

  constructor(
    loopInfo: LoopInfo,
    paramMappings: Map<Param, Expr>,
    exprs: Expr[]
  ) {
    super(loopInfo, paramMappings);
    this.exprs = exprs;
  }
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

export function renderBlockToIR(block: RenderBlock): IRNode {
  if (
    typeof block.inNum !== "number" ||
    typeof block.outNum !== "number" ||
    block.loopNum instanceof Expr
  ) {
    throw new Error("a render block num was not a normal number");
  }

  const loopInfo: LoopInfo = {
    inNum: block.inNum,
    outNum: block.outNum,
    loopNum: block.loopNum ?? 1,
    once: block.once,
  };

  if (isOnlyExpr(block.body)) {
    return new IRLeaf(loopInfo, block.paramMappings, block.body);
  }

  if (isOnlyRenderBlock(block.body)) {
    return new IRTree(
      loopInfo,
      block.paramMappings,
      block.body.map(renderBlockToIR)
    );
  }

  throw new Error("render block contained mix of types");
}
