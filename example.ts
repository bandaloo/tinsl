import { higherOrderSpiral } from "./src/runner/draws";
import { Runner } from "./src/runner/runner";

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const gl = glCanvas.getContext("webgl2");

if (gl === null) throw new Error("problem getting the gl context");

const sourceCanvas = document.getElementById("source") as HTMLCanvasElement;
const source = sourceCanvas.getContext("2d");

console.log(source);

if (source === null) throw new Error("problem getting the source context");

const grd = source.createLinearGradient(0, 0, 960, 0);
grd.addColorStop(0, "black");
grd.addColorStop(1, "white");
source.fillStyle = grd;
source.fillRect(0, 0, 960, 540);
source.fillStyle = "white";
source.fillRect(960 / 4, 540 / 4, 960 / 2, 540 / 2);

const bloom = `def threshold 0.9
uniform float u_size;

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

{ vec4(frag.rgb * (step(1. - luma(frag0), 1. - threshold)), frag.a); } -> 1 

{ @two_pass_blur(size: 1., reps: 3, channel: 1);} -> 1
//{ vec4(1., 0., 0., 1.); } -> 1

{ frag0 + frag1; } -> 0
`;

const redSimple = `0 -> { frag0 * vec4(1., 0., 0., 1.); } -> 0`;

const rgbTextures = `
{ vec4(1., 0., 0., 1.); } -> 1
{ vec4(0., 1., 0., 1.); } -> 2
{ vec4(0., 0., 1., 1.); } -> 3
{ frag0 * (frag1 + frag2); }
`;

const ifElse = `
fn redOrBlue (int x) {
  if (x > 0) return vec4(1., 0., 0., 1.);
  else return vec4(0., 0., 1., 1.);
}

{ redOrBlue(-1); } -> 1
{ redOrBlue(1); } -> 2
0 -> { frag * (frag1 + frag2); }
`;

const forLoop = `
fn keepDividingByTwo (float x, int reps) {
  mut r := 1.;
  for (int i = 0; i < reps; i++) {
    r /= float(2);
  }
  return r;
}

{ frag * keepDividingByTwo(1., 3); }
`;

const sobel = `
vec4 sobel(int channel = -1) {
  uv := pos / res;
  w := 1. / res.x;
  h := 1. / res.y;

  k := vec4[](
    frag(channel, uv + vec2(-w, -h)),
    frag(channel, uv + vec2(0., -h)),
    frag(channel, uv + vec2(w, -h)),
    frag(channel, uv + vec2(-w, 0.)),

    frag(channel, uv + vec2(w, 0.)),
    frag(channel, uv + vec2(-w, h)),
    frag(channel, uv + vec2(0., h)),
    frag(channel, uv + vec2(w, h))
  );

  edge_h := k[2] + (2. * k[4]) + k[7] - (k[0] + (2. * k[3]) + k[5]);
  edge_v := k[0] + (2. * k[1]) + k[2] - (k[5] + (2. * k[6]) + k[7]);
  sob := sqrt(edge_h * edge_h + edge_v * edge_v);

  return vec4(1. - sob.rgb, 1.);
}

{ sobel(); }`;

const godrays = `fn godrays (
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

  vec4 color = col;

  for (int i = 0; i < num_samples; i++) {
    uv -= delta_uv;
    tex_sample := frag(channel, uv) * illumination_decay * weight;
    color += tex_sample;
    illumination_decay *= decay;
  }

  return color * exposure;
}

{ godrays(); }`;

const code = godrays;

let runner: Runner;

try {
  runner = new Runner(gl, code, [sourceCanvas], {});
} catch (err) {
  console.log(err.message);
  throw "look at the logged error message";
}

let drawingFunc = higherOrderSpiral([255, 0, 0], [0, 0, 0]);

let frame = 0;

const animate = (time: number) => {
  runner.draw();
  drawingFunc(time / 1000, frame, source, sourceCanvas);
  requestAnimationFrame(animate);
};

animate(0);

//runner.draw();
