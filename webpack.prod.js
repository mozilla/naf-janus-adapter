const path = require("path");
const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const common = require("./webpack.common");

module.exports = merge(common, {
  output: {
    filename: "naf-janus-adapter.min.js"
  },
  devtool: "source-map",
  plugins: [new MinifyPlugin()]
});
