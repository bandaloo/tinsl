import { expect } from "chai";
import { parse } from "./testhelpers";
import chaiExclude from "chai-exclude";

describe("renderblock has refresh", () => {
  it("refresh at first level of render block", () => {
    expect(
      parse("1 -> { 'red'; frag / 2.; refresh; } -> 0")[0].containsRefresh()
    ).to.be.true;
  });

  it("refresh in nested render block", () => {
    expect(
      parse(`
1 -> {
  'red';
  frag / 2.;
  { 'blue'; refresh; }
  frag * 2.;
} -> 0`)[0].containsRefresh()
    ).to.be.true;
  });

  it("no refresh at any level of render block", () => {
    expect(
      parse(`
1 -> {
  'red';
  frag / 2.;
  { 'blue'; vec4(1., 0., 0., 1.); }
  frag * 2.;
} -> 0`)[0].containsRefresh()
    ).to.be.false;
  });
});
