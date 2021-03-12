import { expect } from "chai";
import { extractTopLevel, parse, parseAndCheck } from "./testhelpers";
import chaiExclude from "chai-exclude";
import { RenderBlock } from "./nodes";

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
