import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Runner } from "./src/runner/runner";

monaco.editor.defineTheme("tinsl", {
  base: "vs-dark",
  inherit: true,
  rules: [],
  colors: {
    "editor.foreground": "#00000000",
    "editor.background": "#EDF9FA00",
    "editorCursor.foreground": "#8B0000",
    "editor.lineHighlightBackground": "#0000FF20",
    "editorLineNumber.foreground": "#008800",
    "editor.selectionBackground": "#88000030",
    "editor.inactiveSelectionBackground": "#88000015",
  },
});

console.log("test!!!");

monaco.editor.create(document.getElementById("editor") as HTMLElement, {
  value: 'console.log("Hello, world")',
  language: "javascript",
  minimap: {
    enabled: false,
  },
  theme: "tinsl",
});

console.log("playground environment");

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

/*
async function getVideo(constraints?: MediaStreamConstraints) {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
  }

  const video = document.createElement("video");
  video.srcObject = stream;
  video.play();
  return video;
}*/

const video = getVideo();

const startup = () => {
  try {
    console.log("vid", video.videoWidth, video.videoHeight);
    let runner: Runner;
    const code = `0->{vec4(1., 0., 0., 1.)*frag;}->1`;
    runner = new Runner(gl, code, [video], {});

    const animate = (time: number) => {
      runner.draw();
      //drawingFunc(time / 1000, frame, source, sourceCanvas);
      requestAnimationFrame(animate);
    };

    animate(0);
  } catch (err) {
    console.log(err.message);
    throw "look at the logged error message";
  }
};

video.addEventListener("playing", startup);
