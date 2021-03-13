import { expect } from "chai";
import chaiExclude from "chai-exclude";
import { parseAndCheck } from "./testhelpers";

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

pr two_pass_blur(float size, int reps, int channel = -1) {
  loop reps {
    blur5(vec2(size, 0.), channel); refresh;
    blur5(vec2(0., size), channel); refresh;
  }
}

{ frag0 * step(luma(frag0), threshold); } -> 1

{ @two_pass_blur(size: 1., reps: 3); } -> 1

{ frag0 + frag1; } -> 0`)
    ).to.not.throw();
  });
});

it("parses godrays effect", () => {
  expect(() =>
    parseAndCheck(`
fn godrays (
  vec4 col = frag,
  float exposure = 1.,
  float decay = 1.,
  float density = 1.,
  float weight = 0.01,
  vec2 light_pos = vec2(.5, .5),
  int num_samples = 100,
  int channel = -1
) {
  mut uv := pos / res;
  delta_uv := (uv - light_pos) / float(num_samples) * density;

  mut illumination_decay := 1.;

  for (mut i := 0; i < num_samples; i++) {
    uv -= delta_uv;
    tex_sample := frag(channel, uv) * illumination_decay * weight;
    col += tex_sample;
    illumination_decay *= decay;
  }

  return col * exposure;
}`)
  ).to.not.throw();
});
