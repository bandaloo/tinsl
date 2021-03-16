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

export function getAllUsedFuncs(exprs: Expr[]) {
  const funcs: Set<FuncDef> = new Set();
  for (const e of exprs) {
    if (e instanceof CallExpr && e.userDefinedFuncDef !== undefined) {
      funcs.add(e.userDefinedFuncDef);
    } else {
      const subFuncs = getAllUsedFuncs(e.getSubExpressions());
      for (const f of subFuncs) funcs.add(f);
      // TODO also pull in the functions that that functino uses, and the
      // functions those functions use. can't cause a cycle because no recursion
    }
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
