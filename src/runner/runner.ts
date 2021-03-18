import { isTinslLeaf, TinslLeaf, TinslTree } from "../nodes";

////////////////////////////////////////////////////////////////////////////////
// constants

const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

////////////////////////////////////////////////////////////////////////////////
// types

/** setting for min and max texture filtering modes */
type FilterMode = "linear" | "nearest";
/** setting for clamp */
type ClampMode = "clamp" | "wrap";

/** extra texture options for the merger */
interface MergerOptions {
  /** min filtering mode for the texture */
  minFilterMode?: FilterMode;
  /** max filtering mode for the texture */
  maxFilterMode?: FilterMode;
  /** how the edges of the texture should be handled */
  edgeMode?: ClampMode;
  /** textures or images to use as extra channels */
  channels?: (TexImageSource | WebGLTexture | null)[];
}

interface TexInfo {
  front: TexWrapper;
  back: TexWrapper;
  scene: TexWrapper | undefined; // TODO don't need scene or front
  bufTextures: TexWrapper[];
}

/** useful for debugging */
interface TexWrapper {
  name: string;
  tex: WebGLTexture;
}

interface NameToLoc {
  // the counter is what enables expressions to exist across multiple programs
  [name: string]: { type: string; loc: WebGLUniformLocation };
}

////////////////////////////////////////////////////////////////////////////////
// program loop classes

class WebGLProgramTree {
  loop: number;
  once: boolean;
  body: (WebGLProgramTree | WebGLProgramLeaf)[];

  constructor(
    tree: TinslTree,
    gl: WebGL2RenderingContext,
    vShader: WebGLShader
  ) {
    this.loop = tree.loop;
    this.once = tree.once;

    const f = (node: TinslTree | TinslLeaf) => {
      if (isTinslLeaf(node)) return new WebGLProgramLeaf(node, gl, vShader);
      return new WebGLProgramTree(node, gl, vShader);
    };

    this.body = tree.body.map(f);
  }
}

class WebGLProgramLeaf {
  program: WebGLProgram;
  locs: NameToLoc;
  target: number;

  constructor(
    leaf: TinslLeaf,
    gl: WebGL2RenderingContext,
    vShader: WebGLShader
  ) {
    this.target = leaf.target;
    [this.program, this.locs] = compileProgram(gl, vShader, leaf);
  }
}

////////////////////////////////////////////////////////////////////////////////
// webgl helpers

/** creates a texture given a context and options */
function makeTexture(
  gl: WebGL2RenderingContext,
  options?: MergerOptions // circular dependency on interface is okay?
) {
  const texture = gl.createTexture();
  if (texture === null) {
    throw new Error("problem creating texture");
  }

  // flip the order of the pixels, or else it displays upside down
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // bind the texture after creating it
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.drawingBufferWidth,
    gl.drawingBufferHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );

  const filterMode = (f: undefined | FilterMode) =>
    f === undefined || f === "linear" ? gl.LINEAR : gl.NEAREST;

  // how to map texture element
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    filterMode(options?.minFilterMode)
  );
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    filterMode(options?.maxFilterMode)
  );

  if (options?.edgeMode !== "wrap") {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  return texture;
}

/** copies onto texture */
export function sendTexture(
  gl: WebGL2RenderingContext,
  src: TexImageSource | WebGLTexture | null
) {
  // if you are using textures instead of images, the user is responsible for
  // updating that texture, so just return
  if (src instanceof WebGLTexture || src === null) return;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}

/** compile a full program */
function compileProgram(
  gl: WebGL2RenderingContext,
  vShader: WebGLShader,
  leaf: TinslLeaf
): [WebGLProgram, NameToLoc] {
  const uniformLocs: NameToLoc = {};

  const fShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (fShader === null) {
    throw new Error("problem creating fragment shader");
  }

  gl.shaderSource(fShader, leaf.source);
  gl.compileShader(fShader);

  const program = gl.createProgram();
  if (program === null) {
    throw new Error("problem creating program");
  }

  gl.attachShader(program, vShader);
  gl.attachShader(program, fShader);

  const shaderLog = (name: string, shader: WebGLShader) => {
    const output = gl.getShaderInfoLog(shader);
    if (output) console.log(`${name} shader info log\n${output}`);
  };

  shaderLog("vertex", vShader);
  shaderLog("fragment", fShader);

  gl.linkProgram(program);
  gl.useProgram(program);

  for (const unif of leaf.requires.uniforms) {
    const location = gl.getUniformLocation(program, unif.name);
    if (location === null) {
      throw new Error("couldn't find uniform " + unif.name);
    }

    uniformLocs[unif.name] = { type: unif.type, loc: location };
  }

  const getLocation = (name: string) => {
    const loc = gl.getUniformLocation(program, name);
    if (loc === null) throw new Error(`could not get location for "${name}"`);
    return loc;
  };

  if (leaf.requires.resolution) {
    const uResolution = getLocation("uResolution");
    gl.uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  if (leaf.requires.time) {
    const timeName = "uTime";
    const uTime = getLocation(timeName);
    uniformLocs[timeName] = { type: "float", loc: uTime };
  }

  for (const s of leaf.requires.samplers) {
    const samplerName = "uSampler" + s;
    const uSampler = getLocation(samplerName);
    uniformLocs[samplerName] = { type: "sampler2D", loc: uSampler };
  }

  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  return [program, uniformLocs];
}
