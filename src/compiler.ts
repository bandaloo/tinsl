import { Expr, ExSt, ProcCall, ProcDef, RenderBlock } from "./nodes";

// expand procs -> fill in default in/out nums -> regroup by refresh

export function expandProcs(block: RenderBlock, outer?: RenderBlock) {
  // TODO
  for (const b of block.body) {
    if (b instanceof ProcCall) {
      if (b.cachedProc === undefined) {
        throw new Error("procedure in body didn't have cached definition");
      }

      const procCall = b;
      const procDef = b.cachedProc;

      // fill in the params passed into frag or in/out render blocks
    }
  }
}

/*
function expandProc(call: ProcCall, def: ProcDef): ExSt[] {
  const args = call.args;
}
*/

export function fillInDefaults(
  block: RenderBlock,
  outer?: RenderBlock
): RenderBlock {
  const defaultNum = (
    innerNum: number | Expr | null,
    outerNum: number | Expr | null
  ) => {
    if (innerNum instanceof Expr) {
      throw new Error(
        "render block number had an expression outside of a procedure"
      );
    }
    if (innerNum === null || innerNum === -1) {
      if (outerNum === null) return 0; // at the top level
      return outerNum;
    }
    return innerNum;
  };

  block.inNum = defaultNum(block.inNum, outer?.inNum ?? null);
  block.outNum = defaultNum(block.outNum, outer?.outNum ?? null);

  for (const b of block.body) {
    if (b instanceof RenderBlock) fillInDefaults(b, block);
  }

  return block;
}
