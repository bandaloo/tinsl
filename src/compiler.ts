import {
  CallExpr,
  compileTimeInt,
  Expr,
  ExSt,
  Frag,
  IdentExpr,
  Param,
  ProcCall,
  RenderBlock,
} from "./nodes";

// expand procs -> fill in default in/out nums -> regroup by refresh

export function expandProcsInBlock(block: RenderBlock) {
  const newBody: ExSt[] = [];

  for (const b of block.body) {
    if (b instanceof ProcCall) {
      if (b.cachedProc === undefined) {
        throw new Error("procedure in body didn't have cached definition");
      }
      newBody.push(...expandProc(b));
    } else if (b instanceof RenderBlock) {
      expandProcsInBlock(b);
      newBody.push(b);
    } else {
      newBody.push(b);
    }
  }

  block.body = newBody;
  return block;
}

function expandProc(call: ProcCall): ExSt[] {
  const fillAtomicNum = (renderNum: null | Expr | number) => {
    if (renderNum instanceof Expr) {
      if (!(renderNum instanceof IdentExpr)) {
        throw new Error(
          "render num was not ident at code gen step; " +
            "should have been caught by the checker"
        );
      }
      const res = renderNum.cachedParam;

      if (res === undefined) {
        throw new Error("cached param was somehow undefined");
      }
      /*
      if (res === undefined) {
        throw new Error("cached resolve of ident was somehow undefined");
      }

      if (!(res instanceof Param)) {
        throw new Error(
          "result was not instance of param; " +
            "this should not be possible if checker did its job"
        );
      }
      */

      // after resolving the ident expression, it's actually the same reference
      // as what is stored in params, so we can use indexOf
      const index = params.indexOf(res);
      if (index === -1) throw new Error("could not find index of param");

      const arg = args[index];

      const argRes =
        (arg instanceof IdentExpr ? arg.cachedResolve : null) ?? null;

      // at this point, the arg can only be an ident -> top def or int directly
      const int = compileTimeInt(arg, argRes);

      if (int === null) throw new Error("int resolved to null");

      return int;
    }
    return renderNum;
  };

  const def = call.cachedProc;
  if (def === undefined) throw new Error("call didn't have cached proc");

  const args = call.getAllArgs();
  const params = def.params;

  // TODO this is probably overly-defensive
  if (args.length !== params.length) {
    throw new Error(
      "args length didn't equal params length when expanding procedure"
    );
  }

  const result: ExSt[] = [];

  for (const b of def.body) {
    if (b instanceof RenderBlock) {
      b.inNum = fillAtomicNum(b.inNum);
      b.outNum = fillAtomicNum(b.outNum);
      b.loopNum = fillAtomicNum(b.loopNum);
      result.push(b);
    } else if (b instanceof ProcCall) {
      result.push(...expandProc(b));
    } else if (b instanceof CallExpr && b.call instanceof Frag) {
      b.call.sampler = fillAtomicNum(b.call.sampler);
      result.push(b);
    } else {
      result.push(b);
    }
  }

  return result;
}

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
