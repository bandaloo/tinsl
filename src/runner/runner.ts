import { genTinsl } from "../gen";
import { getAllSamplers, isTinslLeaf, TinslLeaf, TinslTree } from "../nodes";
import { increasesByOneFromZero } from "../util";

////////////////////////////////////////////////////////////////////////////////
// constants

const V_SOURCE = `attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}\n`;

const U_TIME = "uTime";

const U_RES = "uResolution";

////////////////////////////////////////////////////////////////////////////////
// types

/** setting for min and max texture filtering modes */
type FilterMode = "linear" | "nearest";
/** setting for clamp */
type ClampMode = "clamp" | "wrap";

/** extra texture options for the merger */
interface RunnerOptions {
  /** min filtering mode for the texture */
  minFilterMode?: FilterMode;
  /** max filtering mode for the texture */
  maxFilterMode?: FilterMode;
  /** how the edges of the texture should be handled */
  edgeMode?: ClampMode;
  /** textures or images to use as extra channels */
  channels?: (TexImageSource | WebGLTexture | null)[];
  /** how much to offset the textures (useful for integration) */
  offset?: number;
}

interface TexInfo {
  scratch: TexWrapper;
  channels: TexWrapper[];
}

/** useful for debugging */
interface TexWrapper {
  name: string;
  tex: WebGLTexture;
}

interface NameToLoc {
  // the counter is what enables expressions to exist across multiple programs
  [name: string]: { type: string; loc: WebGLUniformLocation } | undefined;
}

////////////////////////////////////////////////////////////////////////////////
// program loop classes

class WebGLProgramTree {
  readonly loop: number;
  readonly once: boolean;
  readonly body: (WebGLProgramTree | WebGLProgramLeaf)[];

  constructor(
    gl: WebGL2RenderingContext,
    tree: TinslTree,
    vShader: WebGLShader,
    rightMost: boolean
  ) {
    this.loop = tree.loop;
    this.once = tree.once;

    const f = (node: TinslTree | TinslLeaf, i: number) => {
      const innerRightMost = rightMost && i === tree.body.length - 1;
      if (isTinslLeaf(node)) {
        return new WebGLProgramLeaf(gl, node, vShader, innerRightMost);
      }
      return new WebGLProgramTree(gl, node, vShader, innerRightMost);
    };

    this.body = tree.body.map(f);
  }

  run(texInfo: TexInfo, framebuffer: WebGLFramebuffer, last: boolean) {
    // TODO get rid of hard-coded "last" and set it earlier
    for (const b of this.body) {
      b.run(texInfo, framebuffer, true);
    }
  }
}

class WebGLProgramLeaf {
  readonly program: WebGLProgram;
  readonly locs: NameToLoc;
  readonly target: number;
  readonly gl: WebGL2RenderingContext;
  readonly samplers: number[];
  readonly last: boolean;

  constructor(
    gl: WebGL2RenderingContext,
    leaf: TinslLeaf,
    vShader: WebGLShader,
    rightMost: boolean
  ) {
    this.gl = gl;
    this.target = leaf.target;
    this.samplers = leaf.requires.samplers; // TODO is this sorted? and does that matter?
    this.last = rightMost;
    [this.program, this.locs] = compileProgram(this.gl, leaf, vShader);
  }

  run(texInfo: TexInfo, framebuffer: WebGLFramebuffer, last: boolean) {
    const swap = () => {
      [texInfo.scratch, texInfo.channels[this.target]] = [
        texInfo.channels[this.target],
        texInfo.scratch,
      ];
    };

    // swap against the target texture slot
    swap();

    // bind all the required textures
    for (const c of this.samplers) {
      // TODO add offset
      this.gl.activeTexture(this.gl.TEXTURE0 + c);
      this.gl.bindTexture(this.gl.TEXTURE_2D, texInfo.channels[c].tex);
    }

    // final swap to replace the texture
    this.gl.useProgram(this.program);

    // apply all the uniforms
    // TODO

    const uTime = this.locs[U_TIME];

    // TODO to stub this out it always sets time to 0. change!
    // we want to update all uniforms in the same way
    if (uTime !== undefined) this.gl.uniform1f(uTime, 0);

    if (last) {
      // draw to the screen by setting to default framebuffer (null)
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      console.log("last!!!");
    } else {
      console.log("not last!!!!");
      // we are not on the last pass
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        texInfo.channels[0].tex, // TODO do we always want zero?
        0
      );
    }
    // allows us to read from the back texture
    // default sampler is 0, so `uSampler` will sample from texture 0
    this.gl.activeTexture(this.gl.TEXTURE0); // TODO revisit with offset
    // TODO is this the texture we want to bind? do we need to swap first?
    this.gl.bindTexture(this.gl.TEXTURE_2D, texInfo.channels[this.target].tex);
    // we are on the last program, so draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // swap the textures back
    swap(); // TODO do we need to swap?
  }

  delete() {
    this.gl.deleteProgram(this.program);
  }
}

////////////////////////////////////////////////////////////////////////////////
// graphics resources management

export class Runner {
  readonly gl: WebGL2RenderingContext;
  readonly options: RunnerOptions;
  private readonly vertexBuffer: WebGLBuffer;
  private readonly vShader: WebGLShader;
  private readonly texInfo: TexInfo;
  private readonly framebuffer: WebGLFramebuffer;
  private readonly programs: WebGLProgramTree;
  private readonly sources: (TexImageSource | WebGLTexture | undefined)[];

  constructor(
    gl: WebGL2RenderingContext,
    code: TinslTree | string,
    sources: (TexImageSource | WebGLTexture | undefined)[],
    options: RunnerOptions
  ) {
    const tree = typeof code === "string" ? genTinsl(code) : code;

    this.sources = sources;

    console.log(tree);

    this.gl = gl;
    this.options = options;

    // set the viewport
    const [w, h] = [this.gl.drawingBufferWidth, this.gl.drawingBufferHeight];
    this.gl.viewport(0, 0, w, h);

    // set up the vertex buffer
    const vertexBuffer = this.gl.createBuffer();

    if (vertexBuffer === null) {
      throw new Error("problem creating vertex buffer");
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);

    const vertexArray = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    const triangles = new Float32Array(vertexArray);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, triangles, this.gl.STATIC_DRAW);

    // save the vertex buffer reference so we can delete it later
    this.vertexBuffer = vertexBuffer;

    // compile the simple vertex shader (2 big triangles)
    const vShader = this.gl.createShader(this.gl.VERTEX_SHADER);
    if (vShader === null) {
      throw new Error("problem creating the vertex shader");
    }

    this.gl.shaderSource(vShader, V_SOURCE);
    this.gl.compileShader(vShader);

    // save the vertex shader reference so we can delete it later
    this.vShader = vShader;

    // make textures
    const scratch = { name: "scratch", tex: makeTex(this.gl, this.options) };
    const samplers = Array.from(getAllSamplers(tree)).sort();

    console.log("samplers", samplers);

    if (!increasesByOneFromZero(samplers)) {
      // TODO throw this earlier
      throw new Error("all sampler numbers must start from 0 without skipping");
    }

    const channels = samplers.map((s, i) => {
      // over-indexing is fine because it will be undefined, meaning empty
      const channel = sources[i];
      if (channel === undefined) {
        return { name: "empty " + s, tex: makeTex(this.gl, this.options) };
      } else if (channel instanceof WebGLTexture) {
        return { name: "provided " + s, tex: channel };
      } else {
        return { name: "img src " + s, tex: makeTex(this.gl, this.options) };
      }
    });

    console.log(channels);

    console.log("channels", channels);

    this.texInfo = { scratch, channels };

    // create the frame buffer
    const framebuffer = gl.createFramebuffer();
    if (framebuffer === "null") {
      throw new Error("problem creating the framebuffer");
    }

    this.framebuffer = this.gl.createFramebuffer;

    this.programs = new WebGLProgramTree(gl, tree, vShader, true);
  }

  draw(time = 0) {
    //const offset = this.options.offset ?? 0;
    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texInfo.scratch.tex);
    // TODO send to every texture that needs it
    console.log("sources 0", this.sources[0]);
    sendTexture(this.gl, this.sources[0]);
    this.programs.run(this.texInfo, this.framebuffer, true);
    // TODO see if we should unbind this
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    //this.gl.activeTexture(this.gl.TEXTURE0 + offset);
    // TODO implement this
  }
}

////////////////////////////////////////////////////////////////////////////////
// webgl helpers

/** creates a texture given a context and options */
function makeTex(gl: WebGL2RenderingContext, options?: RunnerOptions) {
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
  src: TexImageSource | WebGLTexture | undefined // TODO type for this
) {
  // if you are using textures instead of images, the user is responsible for
  // updating that texture, so just return
  if (src instanceof WebGLTexture || src === undefined) return;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}

/** compile a full program */
function compileProgram(
  gl: WebGL2RenderingContext,
  leaf: TinslLeaf,
  vShader: WebGLShader
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
    const uResolution = getLocation(U_RES);
    gl.uniform2f(uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
  }

  if (leaf.requires.time) {
    const uTime = getLocation(U_TIME);
    uniformLocs[U_TIME] = { type: "float", loc: uTime };
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
