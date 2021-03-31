interface Demos {
  [name: string]: string;
}

export const demos: Demos = {
  club: `
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

// vignette effect: darken and blur the edges
1 -> { mix(frag, 'black'4, 1.5 * length(npos - 0.5)); } -> 0
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
  noop: `
{ frag; }
`,
};
