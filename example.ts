import { Runner } from "./src/runner/runner";

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const gl = glCanvas.getContext("webgl2");

if (gl === null) throw new Error("problem getting the gl context");

const sourceCanvas = document.getElementById("source") as HTMLCanvasElement;
const source = sourceCanvas.getContext("2d");

console.log(source);

if (source === null) throw new Error("problem getting the source context");

source.fillStyle = "black";
source.fillRect(0, 0, 960, 540);
source.fillStyle = "white";
source.fillRect(960 / 4, 540 / 4, 960 / 2, 540 / 2);

/*
const code = `def threshold 0.9
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

{ frag0 * step(luma(frag0), threshold); } -> 1

{ @two_pass_blur(size: u_size, reps: 3, channel: 1); } -> 1

{ frag0 + frag1; } -> 0`;
*/

const code = `0 -> { frag0 * vec4(1., 0., 0., 1.); } -> 0`;

console.log(code);

const runner = new Runner(gl, code, [sourceCanvas], {});

runner.draw();
