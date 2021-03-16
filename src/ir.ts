import {
  Expr,
  isOnlyExpr,
  isOnlyRenderBlock,
  Param,
  RenderBlock,
} from "./nodes";

interface LoopInfo {
  once: boolean;
  inNum: number;
  outNum: number;
  loopNum: number;
}

// IR classes are similar to render blocks but simpler, and narrow the types

class IRNode {
  loopInfo: LoopInfo;
  paramMappings: Map<Param, Expr>;

  constructor(loopInfo: LoopInfo, paramMappings: Map<Param, Expr>) {
    this.loopInfo = loopInfo;
    this.paramMappings = paramMappings;
  }
}

class IRTree extends IRNode {
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

class IRLeaf extends IRNode {
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

export function renderBlockToIR(block: RenderBlock): IRNode {
  if (
    typeof block.inNum !== "number" ||
    typeof block.outNum !== "number" ||
    typeof block.loopNum !== "number"
  ) {
    throw new Error("a render block num was not a normal number");
  }

  const loopInfo: LoopInfo = {
    inNum: block.inNum,
    outNum: block.outNum,
    loopNum: block.loopNum,
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
