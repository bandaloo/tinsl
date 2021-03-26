import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { overlap, regexes, tinsl, types } from "./src/lexer";
import { Runner } from "./src/runner/runner";
import { builtIns } from "./src/typeinfo";

///////////////////////////////////////////////////////////////////////////////
// constants

const STARTING_CODE = "{ 'magenta'4 * frag; }";

const enum Highlight {
  BuiltIn = "#FFCB1C",
  Number = "#FA076B",
  Comment = "#777777",
  String = "#FF853F",
  Ident = "#5ed1ff",
  Type = "#ADFF22",
  Keyword = "#CE29FF",
  Frag = "#FF72CD",
}

///////////////////////////////////////////////////////////////////////////////
// monaco setup

const builtInFuncNames = Object.entries(builtIns).map((b) => b[0]);

const typeRegExp = new RegExp(types.join("|"));
const kwRegExp = new RegExp([...tinsl, ...overlap].join("|"));
const builtInRegExp = new RegExp(builtInFuncNames.join("|"));

monaco.languages.register({ id: "tinsl-lang" });

/*
  float: /(?:[0-9]*\.[0-9]+|[0-9]+\.)/,
  uint: /[0-9]+u/,
  int: /[0-9]+/,
*/

monaco.languages.setMonarchTokensProvider("tinsl-lang", {
  tokenizer: {
    root: [
      [typeRegExp, "tinsl-type"],
      [kwRegExp, "tinsl-kw"],
      [builtInRegExp, "tinsl-builtin"],
      [regexes.float, "tinsl-float"],
      [regexes.uint, "tinsl-uint"],
      [regexes.int, "tinsl-int"],
      [regexes.string, "tinsl-string"],
      [regexes.comment, "tinsl-comment"],
      [regexes.multilineComment, "tinsl-multilinecomment"],
      [regexes.frag, "tinsl-frag"],
      [regexes.ident, "tinsl-ident"],
    ],
  },
});

monaco.editor.defineTheme("tinsl-theme", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "tinsl-type", foreground: Highlight.Type }, // 29
    { token: "tinsl-kw", foreground: Highlight.Keyword }, // 27
    { token: "tinsl-builtin", foreground: Highlight.BuiltIn }, // 22
    { token: "tinsl-uint", foreground: Highlight.Number }, // 24
    { token: "tinsl-float", foreground: Highlight.Number }, // 24
    { token: "tinsl-int", foreground: Highlight.Number }, // 24
    { token: "tinsl-string", foreground: Highlight.String }, // 28
    { token: "tinsl-comment", foreground: Highlight.Comment }, // 23
    { token: "tinsl-multilinecomment", foreground: Highlight.Comment }, // 23
    { token: "tinsl-frag", foreground: Highlight.Frag }, // 25
    { token: "tinsl-ident", foreground: Highlight.Ident }, // 26
  ],
  colors: {
    "editor.background": "#00000000",
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
