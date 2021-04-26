import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { overlap, regexes, tinsl, types } from "./src/lexer";
import { Runner } from "./src/runner/runner";
import { builtIns } from "./src/typeinfo";
import { initVimMode, VimMode } from "monaco-vim";
import { demos } from "./demos";

///////////////////////////////////////////////////////////////////////////////
// constants

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

const FFT_SIZE = 256;
const FFT_LENGTH = FFT_SIZE / 2;

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
      { include: "@whitespace" },
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
      //[regexes.comment, "tinsl-comment"],
      //[regexes.multilineComment, "tinsl-multilinecomment"],
    ],

    comment: [
      [/[^\/*]+/, "tinsl-comment"],
      [/\/\*/, "tinsl-comment", "@push"], // nested comment
      ["\\*/", "tinsl-comment", "@pop"],
      [/[\/*]/, "tinsl-comment"],
    ],

    whitespace: [
      [/[ \t\r\n]+/, "white"],
      [/\/\*/, "tinsl-comment", "@comment"],
      [/\/\/.*$/, "tinsl-comment"],
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
    value: stripFirstLine(demos["club"]),
    language: "tinsl-lang",
    minimap: {
      enabled: false,
    },
    theme: "tinsl-theme",
    contextmenu: false,
    tabSize: 2,
  }
);

///////////////////////////////////////////////////////////////////////////////
// vim mode

VimMode.Vim.map("jk", "<Esc>", "insert");
let vimMode: any;

const statusBar = document.getElementById("statusbar") as HTMLElement;

const startVimMode = () => {
  vimMode = initVimMode(editor, statusBar);
};

const endVimMode = () => {
  /*
  while (statusBar.firstChild !== null) {
    console.log("removing child");
    statusBar.removeChild(statusBar.firstChild);
  }
  */

  vimMode?.dispose();
};

const checkBox = document.getElementById("vim-mode") as HTMLInputElement;

checkBox.addEventListener("change", (e) => {
  checkBox.checked ? startVimMode() : endVimMode();
});

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

function stripFirstLine(code: string) {
  return code.split("\n").slice(1).join("\n");
}

function addDemos() {
  const entries = Object.entries(demos);
  const select = document.getElementById("demos") as HTMLSelectElement;

  select.addEventListener("change", (e) => {
    console.log("event", e);
    const code = demos[select.options[select.selectedIndex].value];
    const stripped = stripFirstLine(code);
    editor.setValue(stripped);
    runTinslProgram();
  });

  console.log("select", select);
  for (const e of entries) {
    const option = document.createElement("option");
    option.value = e[0];
    option.innerText = e[0];
    console.log(option);
    select.appendChild(option);
  }
}

///////////////////////////////////////////////////////////////////////////////
// canvas setup

addDemos();

const glCanvas = document.getElementById("gl") as HTMLCanvasElement;
const glTemp = glCanvas.getContext("webgl2");

if (glTemp === null) throw new Error("problem getting the gl context");
const gl = glTemp;

let errTest = "foo";

async function getVideo() {
  const video = document.createElement("video");
  console.log("trying to get video");
  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.muted = true;
    video.play();
  } catch {
    return null;
  }

  return video;
}

function getPlaceholder() {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  return canvas;
}

function getAudio() {
  const audio = new AudioContext();
  const analyzer = audio.createAnalyser();

  // TODO fix
  try {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
      })
      .then((stream) => {
        const source = audio.createMediaStreamSource(stream);
        source.connect(analyzer);

        analyzer.fftSize = FFT_SIZE;
      });
  } catch (e) {
    console.log("could not get audio");
    return { audio: null, analyzer: null };
  }

  return { audio, analyzer };
}

/*
function getMedia() {
  const video = document.createElement("video");
  const audio = new AudioContext();
  const analyzer = audio.createAnalyser();

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((stream) => {
      video.srcObject = stream;
      video.muted = true;
      video.play();

      const source = audio.createMediaStreamSource(stream);
      source.connect(analyzer);

      analyzer.fftSize = FFT_SIZE;
    });

  return { video, audio, analyzer };
}
*/

//const { video, audio, analyzer } = getMedia();
const video = (await getVideo()) ?? getPlaceholder();
console.log(errTest);
setTimeout(() => {
  console.log(errTest);
}, 1000);
const context =
  video instanceof HTMLCanvasElement ? video.getContext("2d") : null;

const { audio, analyzer } = getAudio();

const analyzerCanvas = document.getElementById("fft") as HTMLCanvasElement;
const analyzerTemp = analyzerCanvas.getContext("2d");

if (analyzerTemp === null) throw new Error("problem getting fft graph context");
const analyzerContext = analyzerTemp;

const FFT_W = analyzerCanvas.width;
const FFT_H = analyzerCanvas.height;

function analyze() {
  if (analyzer === null) return;
  const dataArray = new Uint8Array(analyzer.frequencyBinCount);
  analyzer.getByteFrequencyData(dataArray);
  analyzerContext.fillStyle = "black";
  analyzerContext.fillRect(0, 0, FFT_W, FFT_H);
  analyzerContext.fillStyle = "lime";
  const width = FFT_W / dataArray.length;
  dataArray.forEach((d, i) => {
    const height = Math.round(FFT_H * ((d - 128) / 128));
    analyzerContext.fillRect(i * width, FFT_H - height, width, height);
  });
  return dataArray;
}

const consoleWindow = document.getElementById("console-window") as HTMLElement;

const runTinslProgram = () => {
  if (audio === null) return;
  if (audio.state !== "running") {
    console.log("resuming audio");
    audio.resume();
  }
  const code = monaco.editor.getModels()[0].getValue();
  startup(code);
};

document.getElementById("run")?.addEventListener("click", runTinslProgram);

document.addEventListener("keypress", (e) => {
  if (e.ctrlKey) {
    if (e.key === "Enter") {
      e.preventDefault();
      runTinslProgram();
    } else if (e.key === "H") {
      e.preventDefault();
      const div = document.getElementById("video") as HTMLElement;
      div.style.display = div.style.display !== "none" ? "none" : "block";
    }
  }
});

let request: number | undefined = undefined;

const startTinsl = (code: string) => {
  if (request !== undefined) cancelAnimationFrame(request);
  let runner: Runner;
  runner = new Runner(gl, code, [video], { edgeMode: "wrap" });

  const unifs = runner.getUnifsByPattern(/^fft[0-9]+$/);
  const nums = unifs.map((u) => {
    const m = u.match(/^fft([0-9]+)$/);
    if (m === null) throw new Error("fft match was null");
    const num = parseInt(m[1]);
    if (num >= FFT_LENGTH)
      throw new Error(
        "fft number was not in range " +
          `(needs to be non-negative integer less than ${FFT_LENGTH})`
      );
    return num;
  });

  const animate = (time: number) => {
    if (context !== null) {
      context.fillStyle = "red";
      context.fillRect(100 + 20 * Math.sin(time / 1000), 100, 50, 50);
    }
    runner.draw(time);

    // parse uniform names and get fft data
    const data = analyze();
    if (data !== undefined) {
      unifs.forEach((u, i) => {
        const num = (data[nums[i]] - 128) / 128;
        runner.setUnif(u, num);
      });
    }

    request = requestAnimationFrame(animate);
  };

  animate(0);
};

const startup = (code: string) => {
  consoleWindow.innerText = "";
  try {
    clearErrors();
    startTinsl(code);
  } catch (err) {
    console.log(err.message);
    consoleWindow.innerText = err.message;
    highlightErrors(parseErrorMessage(err.message));
    //throw "look at the logged error message";
  }
};

if (video instanceof HTMLVideoElement) {
  video.addEventListener("playing", runTinslProgram);
}
