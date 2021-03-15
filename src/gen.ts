import {
  CallExpr,
  compileTimeInt,
  Expr,
  ExSt,
  Frag,
  IdentExpr,
  IntExpr,
  Param,
  ProcCall,
  RenderBlock,
  UnaryExpr,
} from "./nodes";

// expand procs -> fill in default in/out nums -> regroup by refresh

/*
export function expandProcsInBlock(
  block: RenderBlock,
  args: Expr[] = [],
  params: Param[] = []
) {
  block.body = expandProcsInBody(block.body, args, params);
  return block;
}

export function expandProcsInBody(
  blockBody: ExSt[],
  args: Expr[],
  params: Param[]
) {
  const newBody: ExSt[] = [];

  for (const b of blockBody) {
    if (b instanceof ProcCall) {
      if (b.cachedProcDef === undefined) {
        throw new Error("procedure in body didn't have cached definition");
      }
      newBody.push(...expandProc(b, args, params));
    } else if (b instanceof RenderBlock) {
      expandProcsInBlock(b, args, params);
      newBody.push(b);
    } else {
      newBody.push(b);
    }
  }

  return newBody;
}
*/

// TODO move on because this finally works, but consider refactoring
export function expandProcsInBlock(block: RenderBlock) {
  block.body = expandBody(block.body, [], [], block);
  return block;
}

function expandBody(
  //call: ProcCall,
  body: ExSt[],
  args: Expr[], //= call.getAllArgs(),
  params: Param[],
  outerBlock: RenderBlock
): ExSt[] {
  //const def = call.cachedProcDef;
  //if (def === undefined) throw new Error("call didn't have cached proc");

  //const _args = args;
  //const _params = params ?? def.params;

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

      // after resolving the ident expression, it's actually the same reference
      // as what is stored in params, so we can use indexOf
      const index = params.indexOf(res);
      if (index === -1) throw new Error("could not find index of param");

      const arg = args[index];

      const argRes =
        (arg instanceof IdentExpr ? arg.cachedResolve : null) ?? null;

      // at this point, the arg can only be an ident -> top def or int directly
      const int = compileTimeInt(arg, argRes);

      if (int !== null) return int;
      throw new Error(
        "int was null, arg could be resolved. arg: " + arg + " res: " + argRes
      );
    }
    return renderNum;
  };

  // TODO this is probably overly-defensive
  if (args.length !== params.length) {
    throw new Error(
      "args length didn't equal params length when expanding procedure"
    );
  }

  const result: ExSt[] = [];

  for (const b of body) {
    if (b instanceof RenderBlock) {
      b.inNum = fillAtomicNum(b.inNum);
      b.outNum = fillAtomicNum(b.outNum);
      b.loopNum = fillAtomicNum(b.loopNum);
      b.body = expandBody(b.body, args, params, b);
      result.push(b);
    } else if (b instanceof ProcCall) {
      // fill in any arg that is an ident before passing on
      const newArgs: Expr[] = [];

      for (const a of b.args) {
        // TODO similar logic in the above function
        if (a instanceof IntExpr || a instanceof UnaryExpr) {
          newArgs.push(a);
          continue;
        }

        if (!(a instanceof IdentExpr)) {
          throw new Error("arg somehow not ident expr");
        }

        const res = a.cachedResolve;
        if (res === undefined) {
          throw new Error("arg didn't have a cached resolve");
        }

        if (res instanceof Param) {
          const index = params.indexOf(res);
          if (index === -1) throw new Error("could not find index of param");

          const newArg = args[index];
          newArgs.push(newArg);
          continue;
        }

        throw new Error("arg somehow not param " + a);
      }
      if (b.cachedProcDef === undefined) throw new Error("no cached proc def");
      const newBody = b.cachedProcDef.body;
      const newParams = b.cachedProcDef.params;
      result.push(...expandBody(newBody, newArgs, newParams, outerBlock));
    } else if (b instanceof CallExpr && b.call instanceof Frag) {
      // TODO this should actually be a list of sampler
      b.call.sampler = fillAtomicNum(b.call.sampler);
      result.push(b);
    }
  }

  // TODO we somehow need an attribute on proc the param so it can be translate
  // maybe a mapping of params to args on each render block? now the above
  // function will have to have a reference to the outer block

  // TODO elements might be added redundantly but that's okay for now
  // TODO create this map earlier? then won't have the need for indexOf
  for (let i = 0; i < args.length; i++) {
    outerBlock.paramMappings.set(params[i], args[i]);
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
