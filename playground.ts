import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { overlap, regexes, tinsl, types } from "./src/lexer";
import { Runner } from "./src/runner/runner";
import { builtIns } from "./src/typeinfo";
import { initVimMode, VimMode } from "monaco-vim";

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

const keywords = [...tinsl, ...overlap];
const typeKeywords = types;
const builtInKeywords = Object.entries(builtIns).map((b) => b[0]);

monaco.languages.register({ id: "tinsl-lang" });

monaco.languages.setMonarchTokensProvider("tinsl-lang", {
  keywords: keywords,
  typeKeywords: typeKeywords,
  builtInKeywords: builtInKeywords,

  tokenizer: {
    root: [
      [regexes.frag, "tinsl-frag"],
      [
        regexes.ident,
        {
          cases: {
            "@keywords": "tinsl-kw",
            "@typeKeywords": "tinsl-type",
            "@builtInKeywords": "tinsl-builtin",
            "@default": "tinsl-ident",
          },
        },
      ],
      [regexes.float, "tinsl-float"],
      [regexes.uint, "tinsl-uint"],
      [regexes.int, "tinsl-int"],
      [regexes.string, "tinsl-string"],
      [regexes.comment, "tinsl-comment"],
      [regexes.multilineComment, "tinsl-multilinecomment"],
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
  },
});

const editor = monaco.editor.create(
  document.getElementById("editor") as HTMLElement,
  {
    value: STARTING_CODE,
    language: "tinsl-lang",
    minimap: {
      enabled: false,
    },
    theme: "tinsl-theme",
  }
);

// TODO be able to turn this off
const vimMode = initVimMode(editor, document.getElementById("statusbar"));
VimMode.Vim.map("jk", "<Esc>", "insert");

///////////////////////////////////////////////////////////////////////////////
// helpers

let oldDecorations: string[] = [];

function parseErrorMessage(message: string): [number, number][] {
  const arr = message.split("\n").slice(1);
  return arr.map((a) => {
    const m = a.match(/line ([0-9]+) column ([0-9]+)/);
    if (m === null) throw Error("no match for lines and columns");
    return [parseInt(m[1]), parseInt(m[2])];
  });
}

function clearErrors() {
  oldDecorations = editor.deltaDecorations(oldDecorations, [
    { range: new monaco.Range(1, 1, 1, 1), options: {} },
  ]);
}

function highlightErrors(linesAndColumns: [number, number][]) {
  const decorations: monaco.editor.IModelDeltaDecoration[] = linesAndColumns
    .map((lc) => {
      return [
        {
          range: new monaco.Range(lc[0], lc[1], lc[0], lc[1] + 1),
          options: { inlineClassName: "error-char", isWholeLine: false },
        },
        {
          range: new monaco.Range(lc[0], lc[1], lc[0], lc[1] + 1),
          options: { inlineClassName: "error-line", isWholeLine: true },
        },
      ];
    })
    .flat();

  oldDecorations = editor.deltaDecorations(oldDecorations, decorations);
}

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
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault();
    const code = monaco.editor.getModels()[0].getValue();
    startup(code);
  }
});

let request: number | undefined = undefined;

const startTinsl = (code: string) => {
  if (request !== undefined) cancelAnimationFrame(request);
  let runner: Runner;
  runner = new Runner(gl, code, [video], { edgeMode: "wrap" });

  const animate = (time: number) => {
    runner.draw();
    request = requestAnimationFrame(animate);
  };

  animate(0);
};

const startup = (code: string) => {
  try {
    clearErrors();
    startTinsl(code);
  } catch (err) {
    console.log(err.message);
    highlightErrors(parseErrorMessage(err.message));
    throw "look at the logged error message";
  }
};

video.addEventListener("playing", () => startup(STARTING_CODE));
