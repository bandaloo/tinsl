import { expect } from "chai";
import { expandProcsInBlock, fillInDefaults } from "./compiler";
import { RenderBlock } from "./nodes";
import { extractTopLevel } from "./testhelpers";

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

    console.log("expanded block", "" + expandedBlock);
    // TODO do something with this test
  });

  it("expands a procedure with in and out num params", () => {
    const expandedBlock = expandProcsInBlock(
      extractTopLevel<RenderBlock>(
        `
pr foo (int x, int y) { x -> {'red'4; } -> y }
{ @foo(0, 1); }`,
        1
      )
    );

    console.log("expanded block", "" + expandedBlock);
    // TODO do something with this test
  });
});

// TODO don't let loop num be -1
