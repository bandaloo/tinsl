import { expect } from "chai";
import {
  expandProcsInBlock,
  fillInDefaults,
  irToSourceLeaf,
  processBlocks,
  regroupByRefresh,
  gen,
} from "./gen";
import { getAllUsedFuncs, IRLeaf, renderBlockToIR } from "./ir";
import { RenderBlock } from "./nodes";
import { extractTopLevel } from "./testhelpers";
import { bloom } from "./testprograms";
import util from "util";

describe("renderblock has refresh", () => {
  it("refresh at first level of render block", () => {
    expect(
      extractTopLevel<RenderBlock>(
        "1 -> { 'red'4; frag / 2.; refresh; } -> 0"
      ).containsRefresh()
    ).to.be.true;
  });

  it("refresh in nested render block", () => {
    expect(
      extractTopLevel<RenderBlock>(`
1 -> {
  'red'4;
  frag / 2.;
  { 'blue'4; refresh; }
  frag * 2.;
} -> 0`).containsRefresh()
    ).to.be.true;
  });

  it("refresh in nested render block", () => {
    expect(
      extractTopLevel<RenderBlock>(
        `
pr foo () {
  frag / 2.;
  { 'blue'4; refresh; }
  frag * 2.;
}

1 -> {
  'green'4;
  @foo();
  'yellow'4;
} -> 0`,
        1
      ).containsRefresh()
    ).to.be.true;
  });

  it("no refresh at any level of render block", () => {
    expect(
      extractTopLevel<RenderBlock>(`
1 -> {
  'red'4;
  frag / 2.;
  { 'blue'4; vec4(1., 0., 0., 1.); }
  frag * 2.;
} -> 0`).containsRefresh()
    ).to.be.false;
  });
});

describe("fill in defaults of render block", () => {
  it("defaults to 0 for undefined in/out nums", () => {
    const defaultedBlock = fillInDefaults(
      extractTopLevel<RenderBlock>("{ 'blue'4; }")
    );

    expect(defaultedBlock.inNum).to.equal(0);
    expect(defaultedBlock.outNum).to.equal(0);
  });

  it("does not change defined in/out nums", () => {
    const defaultedBlock = fillInDefaults(
      extractTopLevel<RenderBlock>("2 -> { 'blue'4; } -> 3")
    );

    expect(defaultedBlock.inNum).to.equal(2);
    expect(defaultedBlock.outNum).to.equal(3);
  });

  it("changes defaults for nested blocks", () => {
    const defaultedBlock = fillInDefaults(
      extractTopLevel<RenderBlock>("2 -> { { 'blue'4; } } -> 3")
    );

    const innerBlock = defaultedBlock.body[0] as RenderBlock;

    expect(innerBlock.inNum).to.equal(2);
    expect(innerBlock.outNum).to.equal(3);
  });

  it("defaults for inner block", () => {
    const defaultedBlock = fillInDefaults(
      extractTopLevel<RenderBlock>("{ { 'blue'4; } }")
    );

    const innerBlock = defaultedBlock.body[0] as RenderBlock;

    expect(innerBlock.inNum).to.equal(0);
    expect(innerBlock.outNum).to.equal(0);
  });
});

describe("expands procedures", () => {
  it("expands a simple procedure", () => {
    const expandedBlock = expandProcsInBlock(
      extractTopLevel<RenderBlock>(
        `
pr foo () { 'red'4; }
{ @foo(); }`,
        1
      )
    );

    //console.log("expanded block", "" + expandedBlock);
    // TODO do something with this test
  });

  it("expands a procedure with in and out num params and loop num", () => {
    const expandedBlock = expandProcsInBlock(
      extractTopLevel<RenderBlock>(
        `
pr foo (int x, int y, int z) { x -> loop z {'red'4; } -> y }
{ @foo(0, 1, 2); }`,
        1
      )
    );

    //console.log("expanded block", "" + expandedBlock);
    // TODO do something with this test
  });

  it("expands a procedure with in and out num, loop num and tex param", () => {
    const expandedBlock = expandProcsInBlock(
      extractTopLevel<RenderBlock>(
        `
pr foo (int x, int y, int z, int w) { x -> loop z { frag(w); } -> y }
{ @foo(0, 1, 2, 3); }`,
        1
      )
    );

    //console.log("expanded block", "" + expandedBlock);
    // TODO do something with this test
  });

  it("expands multiple layers of procedures", () => {
    const expandedBlock = expandProcsInBlock(
      extractTopLevel<RenderBlock>(
        `
pr foo (int x) { x -> { frag(x); } -> x}
pr bar (int y) { @foo(y); }
{ @bar(1); }`,
        2
      )
    );

    const rb = expandedBlock.body[0] as RenderBlock;

    expect(rb.inNum).to.equal(1);
    expect(rb.outNum).to.equal(1);
  });
});

describe("regrouping", () => {
  it("regroups nested", () => {
    const expandedBlock = regroupByRefresh(
      fillInDefaults(
        expandProcsInBlock(
          extractTopLevel<RenderBlock>(
            `
fn fake_blur(vec2 direction) { return "white"4; }

loop 3 {
  {
    fake_blur(vec2(1., 0.)); refresh;
    fake_blur(vec2(0., 1.)); refresh;
  }
  fake_blur(vec2(0., 1.)); refresh;
  fake_blur(vec2(1., 0.)); refresh;
}`,
            1
          )
        )
      )
    );

    // it should look be shaped like: [[[] []] [] []]

    // outer render blocks
    expect(expandedBlock.body.length).to.equal(3);

    // inner render blocks
    expect((expandedBlock.body[0] as RenderBlock).body.length).to.equal(2);
    expect((expandedBlock.body[1] as RenderBlock).body.length).to.equal(1);
    expect((expandedBlock.body[2] as RenderBlock).body.length).to.equal(1);
  });

  it("doesn't create redundant render block wrapping", () => {
    const expandedBlock = regroupByRefresh(
      fillInDefaults(
        expandProcsInBlock(
          extractTopLevel<RenderBlock>(
            `
loop 3 {
  frag0 + frag1;
  mix(frag, "red"4, 0.5);
}`
          )
        )
      )
    );

    // outer render blocks
    expect(expandedBlock.body.length).to.equal(2);
  });
});

describe("getting all funcs in a leaf", () => {
  it("gets all used funcs in ir with no chains", () => {
    const ir = processBlocks(
      extractTopLevel<RenderBlock>(
        `
fn foo () { return "red"4; }
fn bar () { return "blue"4; }
{ foo(); bar(); }`,
        2
      )
    );

    if (!(ir instanceof IRLeaf)) throw new Error("ir not a leaf");

    const funcSet = getAllUsedFuncs(ir.exprs);
    expect(funcSet.size).to.equal(2);
  });

  it("gets all used funcs in ir with no chains", () => {
    const ir = processBlocks(
      extractTopLevel<RenderBlock>(
        `
fn pippo () { return "red"3 / 2.; }
fn pluto () { return "blue"3 / 2.; }
fn paperino () { return "green"3 / 2.; }

fn baz () { return pippo() + pluto() + paperino(); }
fn bar () { a := baz(); return a + baz(); }
fn foo () { return bar(); }

{ vec4(foo().rgb, 1.); }`,
        6
      )
    );

    if (!(ir instanceof IRLeaf)) throw new Error("ir not a leaf");

    const funcSet = getAllUsedFuncs(ir.exprs);
    expect(funcSet.size).to.equal(6);
  });

  // TODO more tests
  // TODO test default parameters in call expressions
});

describe("converting ir leaf to source", () => {
  it("gets all the function definitions", () => {
    const ir = processBlocks(
      extractTopLevel<RenderBlock>(
        `
fn pippo (float d = 2.) { return "red"3 / d; }
fn pluto (float d = 2.) { return "blue"3 / d; }
fn paperino (float d = 2.) { return "green"3 / d; }

fn baz () { return pippo() + pluto(d: 3.) + paperino(4.); }
fn bar () { a := baz(); return a + baz(); }
fn foo () { return bar(); }

{ vec4(foo().rgb, 1.); }`,
        6
      )
    );

    // TODO more testing that the order is ok

    if (!(ir instanceof IRLeaf)) throw new Error("ir not a leaf");

    const source = irToSourceLeaf(ir);
    //fullLog(source);
  });
});

describe("logging source", () => {
  it("gets all the function definitions", () => {
    const comp = gen(bloom);
    for (const c of comp) c.log();
  });
});
// TODO don't let loop num be -1

const fullLog = (input: any) => {
  console.log(
    util.inspect(input, {
      showHidden: false,
      depth: null,
      colors: true,
    })
  );
};

// TODO try to add in set of func def instead of render block
