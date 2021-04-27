interface Demos {
  [name: string]: string;
}

export const demos: Demos = {
  club: `
/******************************************************************************
welcome to the tinsl playground! right now you're looking at a comprehensive
code example that shows off many features of the language. if you want
something less overwhelming, try "one liners" (select that option from the
bottom right menu). click the run button at the bottom to run the program.

everything you see is a work in progress so feedback and github issues are
welcome. check out the readme on the github page for more details about the
language: https://github.com/bandaloo/tinsl
******************************************************************************/

// uniforms (in playground only!) that match the pattern ^fft[0-9]+$ will
// automatically be updated with the FFT frequency data from your mic.
// fft0 is the lowest and fft127 is the highest
uniform float fft0;

// some colors for our blinking lights
def colors vec4[](
  'magenta'4,
  'cornflower blue'4,
  'crimson'4,
  'green yellow'4,
  'aquamarine'4,
  'orange red'4
)

// converts seconds to milliseconds
def seconds time / 1000.

// define to easily index the color array by time
def chosen_color colors[int(seconds) % 6]

// fast gaussian blur 
// from https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/9.glsl
fn blur(vec2 direction, int channel = -1) {
  uv := npos;
  mut color := vec4(0.0);
  off1 := vec2(1.3846153846) * direction;
  off2 := vec2(3.2307692308) * direction;
  color += frag(channel, uv) * 0.2270270270;
  color += frag(channel, uv + (off1 / res)) * 0.3162162162;
  color += frag(channel, uv - (off1 / res)) * 0.3162162162;
  color += frag(channel, uv + (off2 / res)) * 0.0702702703;
  color += frag(channel, uv - (off2 / res)) * 0.0702702703;
  return color;
}

// procedure to do horizontal then vertical blur 
pr two_pass_blur(float size, int reps, int channel = -1) {
  loop reps {
    blur(vec2(size, 0.), channel);
    refresh;
    blur(vec2(0., size), channel);
  }
}

// prime the accumulation texture only one time
// (this is so it won't flash white when starting)
0 -> once { chosen_color * frag; } -> 1

0 -> {
  frag; // set the color to frag0 (0 implied by \`0 ->\` before this block)
  chosen_color * prev; // multiply by previous color (in this case, it's \`frag\`)
  prev * .1 + frag1 * .97; // blend with the accumulation buffer; oversaturate a bit
} -> 1

1 -> {
  // darken the edges
  mix(frag, 'black'4, 1.5 * length(npos - 0.5));
  // blend with black based on fft analysis
  // we do some simple filtering to drop to zero if below 0.1 and scale by 0.7
  mix(prev, 'black'4, fft0 < 0.1 ? 0.: fft0 * 0.7);
} -> 0

// blur the edges
0 -> { @two_pass_blur(2. * length(npos - 0.5), 3); } -> 0
`,
  thermalish: `
def threshold 0.3 // luma threshold for 1 bit color

// from https://github.com/hughsk/glsl-hsv2rgb/blob/master/index.glsl
// most regular glsl works in tinsl just fine
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// gets the luma of a color
fn luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

// convert to 1 bit color
0 -> { vec4(vec3(step(threshold, luma(frag))), 1.); } -> 0
// do some pixel accumulation to get a motion blur trail
0 -> { 0.03 * frag + 0.97 * frag1; } -> 1
// take the luma and convert that to hue
1 -> { vec4(hsv2rgb(vec3(luma(frag) / 2., .5, 1.)), 1.); } -> 0`,
  "one liners": `
def seconds time / 1000.

// gets the luma of a color
fn luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

// uncomment each individually to test these one-liners

// monochrome
{ vec4(vec3(luma(frag)), 1.); }

// sepia
//{ '#B17C66FF' * vec4(vec3(luma(frag)), 1.); }

// darken edges
//{ mix(frag, 'black'4, 1.5 * length(npos - 0.5)); }

// one bit color
//{ vec4(vec3(step(0.3, luma(frag))), 1.); }

// mitosis
//{ frag(npos + vec2(sin(npos.x * 2. + seconds), 0.)); }

// offset by the red channel
//{ frag(npos + frag.r / 3.); }

// mirror
//{ frag(vec2(1. - npos.x, npos.y)); }

// colorize
//{ 'aquamarine'4 * frag; }

// sierpinski
//{ frag * vec4(vec3((float(int(pos.x) & int(pos.y + time / 9.)) > 1. ? 1. : 0.)), 1.); }
`,
  fft: `
// make some noise!!!
// pound your desk or play some music with a lot of bass

// 0 is the lowest frequency; can instead go all the way up to fft127
uniform float fft0;

// offset the colors by the fft; do some simple filtering for values below 0.1
def epsilon 0.01 * (fft0 < 0.1 ? 0. : fft0)

// helper function to get the luma
fn luma(vec4 color) {
  return dot(color.rgb, vec3(0.299, 0.587, 0.114));
}

0 -> { vec4(vec3(1. - step(0.2, luma(frag))), 1.); } -> 0

0 -> { frag * 'lime'4 + frag(npos + epsilon) * 'red'4 + frag(npos - epsilon) * 'blue'4; }
`,
  noop: `
{ frag; }
`,
};
