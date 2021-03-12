import { expect } from "chai";
import { parse, parseAndCheck } from "./testhelpers";
import chaiExclude from "chai-exclude";
import { RenderBlock } from "./nodes";

const extractRenderBlock = (str: string, index = 0) =>
  parseAndCheck(str)[index] as RenderBlock;

describe("renderblock has refresh", () => {
  it("refresh at first level of render block", () => {
    expect(
      extractRenderBlock(
        "1 -> { 'red'4; frag / 2.; refresh; } -> 0"
      ).containsRefresh()
    ).to.be.true;
  });

  it("refresh in nested render block", () => {
    expect(
      extractRenderBlock(`
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
      extractRenderBlock(
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
      extractRenderBlock(`
1 -> {
  'red'4;
  frag / 2.;
  { 'blue'4; vec4(1., 0., 0., 1.); }
  frag * 2.;
} -> 0`).containsRefresh()
    ).to.be.false;
  });
});
