import { getAllUsedFuncs, IRLeaf, IRNode, IRTree, renderBlockToIR } from "./ir";
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
  Refresh,
  RenderBlock,
  UnaryExpr,
} from "./nodes";
import { parse, parseAndCheck } from "./testhelpers";

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
    console.log("args", args);
    console.log("len", args.length);
    console.log("params", params);
    console.log("len", params.length);
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

      if (b.cachedProcDef === undefined) {
        throw new Error("cached proc def was undefined");
      }

      const filledArgs = b.cachedProcDef.fillInNamed(b.args);
      b.cachedProcDef.addInDefaults(filledArgs);

      for (const a of filledArgs) {
        // unwrap named if necessary
        //if (!(a instanceof Expr)) a = a.expr;

        // TODO similar logic in the above function
        /*
        if (a instanceof IntExpr || a instanceof UnaryExpr) {
          newArgs.push(a);
          continue;
        }
        */

        if (!(a instanceof IdentExpr)) {
          newArgs.push(a);
          continue;
        }

        /*
        if (!(a instanceof IdentExpr)) {
          console.log("arg", a);
          throw new Error("arg somehow not ident expr ");
        }
        */

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
      // TODO might be more convenient to have these be the params/args that get
      // set in the map
      const newParams = b.cachedProcDef.params;
      result.push(...expandBody(newBody, newArgs, newParams, outerBlock));
    } else if (b instanceof CallExpr && b.call instanceof Frag) {
      // TODO this should actually be a list of sampler
      // TODO do we need to do anything special here?
      //b.call.sampler = fillAtomicNum(b.call.sampler);
      result.push(b);
    } else {
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

export function regroupByRefresh(block: RenderBlock): RenderBlock {
  // will get replaced with new empty array once refresh
  let previous: ExSt[] = [];

  // new render block gets added to this on refresh
  // rest of body gets tacked on when it hits the end
  const regrouped: RenderBlock[] = [];

  let breaks = 0;

  const breakOff = () => {
    if (previous.length > 0) regrouped.push(block.innerCopy(previous));
    previous = [];
    breaks++;
  };

  for (const b of block.body) {
    if (b instanceof Refresh) {
      // break off, ignore refresh
      breakOff();
    } else if (b instanceof RenderBlock) {
      // break off and push on this block separately
      // this avoids redundant regrouping
      breakOff();
      regrouped.push(regroupByRefresh(b));
    } else {
      previous.push(b);
    }
  }

  // prevents nesting in redundant block
  if (breaks === 0) return block;

  breakOff();

  block.body = regrouped;
  return block;
}

export function processBlocks(block: RenderBlock): IRNode {
  return renderBlockToIR(
    regroupByRefresh(fillInDefaults(expandProcsInBlock(block)))
  );
}

export function exprsToSource(exprs: Expr[]) {
  const funcs = getAllUsedFuncs(exprs);

  // generate the code for the function calls
  const funcsList = Array.from(funcs).reverse();

  const funcDefsSource = funcsList.map((f) => f.translate()).join("\n");

  // generate gl_FragColor chain
  /*
  void main() {
  gl_FragColor = gauss5(vec2((length((gl_FragCoord.xy / uResolution - 0.5)) * 3.), 0.));
}
  */
  let mainSource = "void main(){\n";
  for (const e of exprs) {
    mainSource += "gl_FragColor=" + e.translate() + ";\n";
  }
  mainSource += "}";

  return funcDefsSource + mainSource;
}

/** has the side effect of filling out the source string of each node */
export function genSource(ir: IRNode) {
  if (ir instanceof IRTree) {
    for (const n of ir.subNodes) {
      genSource(n);
    }
  } else if (ir instanceof IRLeaf) {
    ir.source = exprsToSource(ir.exprs);
  }

  return ir;
}

export function gen(source: string) {
  const exprs = parseAndCheck(source);
  const blocks = exprs.filter(
    (e): e is RenderBlock => e instanceof RenderBlock
  );
  const processed = blocks.map((b) => processBlocks(b)).map(genSource);
  return processed;
}
