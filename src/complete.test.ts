import { expect } from "chai";
import chaiExclude from "chai-exclude";
import { parseAndCheck } from "./testhelpers";

// TODO move this to another test file
describe("complex program tests", () => {
  it("parses a bloom effect program", () => {
    expect(() =>
      parseAndCheck(`
def threshold 0.9

fn luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

fn blur5(vec2 direction, int channel) {
  uv := pos / res;
  off1 := vec2(1.3333333333333333) * direction;

  mut color := vec4(0.);

  color += frag(uv, channel) * 0.29411764705882354;
  color += frag(uv + (off1 / res), channel) * 0.35294117647058826;
  color += frag(uv - (off1 / res), channel) * 0.35294117647058826;

  return color;
}

pr two_pass_blur(float size, int channel, int reps) {
  loop reps {
    blur5(vec2(size, 0.), channel);
    refresh;
    blur5(vec2(0., size), channel);
    refresh;
  }
}

{ frag0 * step(luma(frag0), threshold); } -> 1

{ @two_pass_blur(1., 1, 3); } -> 1

{ frag0 + frag1; } -> 0`)
    ).to.not.throw();
  });
});