const path = require("path");
//const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = (env, argv) => {
  const name = env.playground ? "playground" : "testsuite";

  // only include all the loaders and plugin when building the playground
  // because monaco needs that, not the test suite
  const rules =
    name === "playground"
      ? [
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
          {
            test: /\.ttf$/,
            use: ["file-loader"],
          },
        ]
      : [];

  const plugins =
    name === "playground"
      ? [
          new MonacoWebpackPlugin({
            features: [
              "!accessibilityHelp", // TODO see what this does
              "!anchorSelect",
              "!bracketMatching",
              "!caretOperations",
              "!clipboard",
              "!codeAction",
              "!codelens",
              "!colorPicker",
              "!comment",
              "!contextmenu",
              "!coreCommands",
              "!cursorUndo",
              "!dnd",
              "!documentSymbols",
              "!find",
              "!folding",
              "!fontZoom",
              "!format",
              "!gotoError",
              "!gotoLine",
              "!gotoSymbol",
              "!hover",
              "!iPadShowKeyboard",
              "!inPlaceReplace",
              "!inlineHints",
              "!inspectTokens",
              "!linesOperations",
              "!linkedEditing",
              "!links",
              "!multicursor",
              "!parameterHints",
              "!quickCommand",
              "!quickHelp",
              "!quickOutline",
              "!referenceSearch",
              "!rename",
              "!smartSelect",
              "!snippets",
              "!suggest",
              "!toggleHighContrast",
              "!toggleTabFocusMode",
              "!transpose",
              "!viewportSemanticTokens",
              "!wordHighlighter",
              "!wordOperations",
              "!wordPartOperations",
            ],
          }),
        ]
      : [];

  return {
    mode: env.production ? "production" : "development",
    entry: env.playground ? "./dist/playground.js" : "./dist/testsuite.js",
    output: {
      filename: `bundle.js`,
      path: path.resolve(__dirname, `${name}-bundle`),
    },
    module: {
      rules: rules,
    },
    plugins: plugins,
    experiments: {
      topLevelAwait: true,
    },
  };
};
