import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

monaco.editor.create(document.getElementById("editor") as HTMLElement, {
  value: 'console.log("Hello, world")',
  language: "javascript",
});
