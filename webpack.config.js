const path = require("path");
//const webpack = require("webpack");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  entry: "./dist/example.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "bundle"),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.ttf$/,
        use: ["file-loader"],
      },
    ],
  },
  plugins: [new MonacoWebpackPlugin()],
};
