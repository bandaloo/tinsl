import nearley from "nearley";
import { TinslError } from "./err";
import grammar from "./grammar";
import { getAllUsedFuncs, IRLeaf, IRTree, renderBlockToIR } from "./ir";
import {
  compileTimeInt,
  Expr,
  ExSt,
  IdentExpr,
  Param,
  ParamScope,
  ParamScoped,
  ProcCall,
  Refresh,
  RenderBlock,
  SourceLeaf,
  SourceTree,
  TinslProgram,
  TinslTree,
  TopDef,
  Uniform,
} from "./nodes";
import { NON_CONST_ID, tinslNearleyError } from "./util";

export function parse(str: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
  try {
    parser.feed(str);
  } catch (e) {
    throw tinslNearleyError(e);
  }

  if (parser.results.length > 1) {
    throw new Error("ambiguous grammar! length: " + parser.results.length);
  }
  return parser.results[0];
}

export function parseAndCheck(str: string) {
  const res = parse(str) as ExSt[];
  new TinslProgram(res).check();
  return res;
}

// expand procs -> fill in default in/out nums -> regroup by refresh

export function expandProcsInBlock(block: RenderBlock) {
  block.scopedBody = expandBody(
    block.body,
    [],
    [],
    new ParamScope(new Map(), null)
  );
  return block;
}

// TODO move on because this finally works, but consider refactoring
function expandBody(
  body: ExSt[],
  args: Expr[],
  params: Param[],
  paramScope: ParamScope
): ParamScoped<ExSt>[] {
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

  // TODO this is probably overly-defensive, but keep for now
  if (args.length !== params.length) {
    throw new Error(
      "args length didn't equal params length when expanding procedure"
    );
  }

  const result: ParamScoped<ExSt>[] = [];

  for (const b of body) {
    if (b instanceof RenderBlock) {
      b.inNum = fillAtomicNum(b.inNum);
      b.outNum = fillAtomicNum(b.outNum);
      b.loopNum = fillAtomicNum(b.loopNum);
      //b.body = expandBody(b.body, args, params, paramScope);
      b.scopedBody = expandBody(b.body, args, params, paramScope);
      result.push(new ParamScoped(b, paramScope));
    } else if (b instanceof ProcCall) {
      // fill in any arg that is an ident before passing on
      const newArgs: Expr[] = [];

      if (b.cachedProcDef === undefined) {
        throw new Error("cached proc def was undefined");
      }

      const filledArgs = b.cachedProcDef.fillInNamedAndDefaults(b.args);
      //b.cachedProcDef.addInDefaults(filledArgs);

      for (const a of filledArgs) {
        // TODO similar logic in the above function
        if (!(a instanceof IdentExpr)) {
          newArgs.push(a);
          continue;
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

        if (res instanceof Uniform || res instanceof TopDef) {
          newArgs.push(a);
          continue;
        }

        throw new Error("ident arg didn't resolve to a param or uniform decl");
      }
      if (b.cachedProcDef === undefined) throw new Error("no cached proc def");
      const newBody = b.cachedProcDef.body;
      // TODO might be more convenient to have these be the params/args that get
      // set in the map
      const newParams = b.cachedProcDef.params;
      const innerParamScope = new ParamScope(new Map(), paramScope);
      newParams.forEach((newParam, i) => {
        const newArg = newArgs[i];
        innerParamScope.set(newParam, newArg);
      });

      const expandedProcBody = expandBody(
        newBody,
        newArgs,
        newParams,
        innerParamScope
      );

      result.push(...expandedProcBody);
    } else {
      result.push(new ParamScoped(b, paramScope));
    }
  }

  // TODO elements might be added redundantly but that's okay for now
  // TODO create this map earlier? then won't have the need for indexOf
  for (let i = 0; i < args.length; i++) {
    // TODO this is the issue. make sure mapping is not overwritten
    //outerBlock.paramMappings.set(params[i], args[i]);
  }

  return result;
}

// TODO rename
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
  for (const b of block.scopedBody) {
    const inmost = b.inmost();
    if (inmost instanceof RenderBlock) {
      fillInDefaults(inmost, block);
    }
  }

  return block;
}

export function regroupByRefresh(block: RenderBlock): RenderBlock {
  // will get replaced with new empty array once refresh
  //let previous: ExSt[] = [];
  let previous: ParamScoped<ExSt>[] = [];

  // new render block gets added to this on refresh
  // rest of body gets tacked on when it hits the end
  const regrouped: ParamScoped<RenderBlock>[] = [];

  let breaks = 0;

  const breakOff = () => {
    if (previous.length > 0)
      regrouped.push(
        new ParamScoped(block.innerCopy(previous), previous[0].mapping)
      );
    previous = [];
    breaks++;
  };

  for (const b of block.scopedBody) {
    const inmost = b.inmost();
    if (inmost instanceof Refresh) {
      // break off, ignore refresh
      breakOff();
    } else if (inmost instanceof RenderBlock) {
      // break off and push on this block separately
      // this avoids redundant regrouping
      breakOff();

      const regroupedMapping = regroupByRefresh(inmost);
      const mapping = regroupedMapping.scopedBody[0].mapping;
      regrouped.push(new ParamScoped(regroupByRefresh(inmost), mapping));
    } else {
      previous.push(b);
    }
  }

  // prevents nesting in redundant block
  if (breaks === 0) return block;

  breakOff();

  block.scopedBody = regrouped;
  return block;
}

export function processBlocks(block: RenderBlock): IRTree | IRLeaf {
  return renderBlockToIR(
    regroupByRefresh(fillInDefaults(expandProcsInBlock(block)))
  );
}

export function irToSourceLeaf(ir: IRLeaf): SourceLeaf {
  const funcs = getAllUsedFuncs(ir.exprs.map((e) => e.inmost()));

  // wrap a leaf together with a map to pass down into translate
  const sl = new SourceLeaf(ir.loopInfo.outNum, ir.loopInfo.inNum);

  // generate the code for the function calls
  const funcsList = Array.from(funcs).reverse();
  const funcDefsSource = funcsList
    .map((f) => f.translate({ leaf: sl, map: null }))
    .join("\n");

  let needsOneMult = ir.oneMult;

  // collect all required textures from functions
  const texNums = new Set<number>();
  for (const f of funcsList) {
    for (const t of f.requiredTexNums) {
      texNums.add(t);
    }
    // also see if any functions need a one multiplication
    needsOneMult ||= f.needsOneMult;
  }

  const nonConstIdDeclSource = needsOneMult
    ? `int int_${NON_CONST_ID} = 1;\nuint uint_${NON_CONST_ID} = 1u;\n`
    : "";

  // collect all required textures from ir
  for (const t of ir.texNums) {
    texNums.add(t);
  }

  // input and output the webgl2 way
  const fragColorSource = "out vec4 fragColor;\n";

  // generate the main loop (series of assignments to fragColor)
  let mainSource = `
void main(){\n`;
  for (const e of ir.exprs) {
    mainSource += "fragColor=" + e.translate(sl) + ";\n";
  }
  mainSource += "}";

  // generate built-in uniforms
  let uniformsSource = "";
  if (sl.requires.time) uniformsSource += "uniform float uTime;\n";
  if (sl.requires.res) uniformsSource += "uniform vec2 uResolution;\n";

  // generate user-defined uniforms
  for (const u of sl.requires.uniforms) {
    uniformsSource += u.translate();
  }

  // generate required samplers
  let samplersSource = "";
  for (const s of sl.requires.samplers) {
    samplersSource += `uniform sampler2D uSampler${s};\n`;
  }

  const defaultPrecisionSource = `#version 300 es
#ifdef GL_ES
precision mediump float;
#endif\n`;

  sl.source =
    defaultPrecisionSource +
    fragColorSource +
    nonConstIdDeclSource +
    samplersSource +
    uniformsSource +
    funcDefsSource +
    mainSource;

  return sl;
}

export function genSource(ir: IRTree | IRLeaf): SourceTree | SourceLeaf {
  if (ir instanceof IRTree) {
    const st = new SourceTree(ir.loopInfo.loopNum, ir.loopInfo.once);
    for (const n of ir.subNodes) {
      st.body.push(genSource(n));
    }
    return st;
  }
  const leaf = irToSourceLeaf(ir);
  leaf.log(); // TODO get rid of this
  return leaf;
}

export function gen(source: string) {
  const exprs = parseAndCheck(source);
  const blocks = exprs.filter(
    (e): e is RenderBlock => e instanceof RenderBlock
  );

  const processed = blocks.map(processBlocks).map(genSource);
  // TODO better place to throw this
  if (processed.length === 0)
    throw new TinslError("error: no render blocks defined");
  return processed;
}

export function genTinsl(source: string): TinslTree {
  const tinslNodes = gen(source).map((s) => s.output());
  // wrap in a tree
  const outerTree = { loop: 1, once: false, body: tinslNodes };
  return outerTree;
}
