import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { tinslMonarchTokens } from "./src/runner/editorlang";
import { Runner } from "./src/runner/runner";

///////////////////////////////////////////////////////////////////////////////
// constants

const STARTING_CODE = "{ 'magenta'4 * frag; }";

///////////////////////////////////////////////////////////////////////////////
// monaco setup

monaco.languages.register({ id: "tinsl-lang" });

monaco.languages.setMonarchTokensProvider("tinsl-lang", {
  tokenizer: {
    root: [[/(fn|pr)/, "tinsl-keyword"]],
  },
});

monaco.editor.defineTheme("tinsl-theme", {
  base: "vs-dark",
  inherit: true,
  rules: [{ token: "tinsl-keyword", foreground: "#00ff00" }],
  colors: {
    //"editor.foreground": "#00000000",
    "editor.background": "#EDF9FA00",
    //"editorCursor.foreground": "#8B0000",
    //"editor.lineHighlightBackground": "#0000FF20",
    //"editorLineNumber.foreground": "#008800",
    //"editor.selectionBackground": "#88000030",
    //"editor.inactiveSelectionBackground": "#00000066",
    //contrastBorder: "#ff0000",
    //"textCodeBlock.background": "#ff0000",
  },
});

monaco.editor.create(document.getElementById("editor") as HTMLElement, {
  value: STARTING_CODE,
  language: "tinsl-lang",
  minimap: {
    enabled: false,
  },
  theme: "tinsl-theme",
});

///////////////////////////////////////////////////////////////////////////////
// canvas setup

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const glTemp = glCanvas.getContext("webgl2");

if (glTemp === null) throw new Error("problem getting the gl context");
const gl = glTemp;

function getVideo() {
  const video = document.createElement("video");

  navigator.mediaDevices
    .getUserMedia({
      video: true,
    })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    });

  return video;
}

const video = getVideo();

document.addEventListener("keypress", (e) => {
  if (e.shiftKey && e.key === "Enter") {
    console.log("shift enter!");
    const code = monaco.editor.getModels()[0].getValue();
    startup(code);
  }
});

let request: number | undefined = undefined;

const startTinsl = (code: string) => {
  if (request !== undefined) cancelAnimationFrame(request);
  let runner: Runner;
  runner = new Runner(gl, code, [video], {});

  const animate = (time: number) => {
    runner.draw();
    request = requestAnimationFrame(animate);
  };

  animate(0);
};

const startup = (code: string) => {
  try {
    startTinsl(code);
  } catch (err) {
    console.log(err.message);
    throw "look at the logged error message";
  }
};

video.addEventListener("playing", () => startup(STARTING_CODE));
