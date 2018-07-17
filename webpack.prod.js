const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common");
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "naf-janus-adapter.min.js"
  },
  devtool: "source-map",

  // necessary due to https://github.com/visionmedia/debug/issues/547
  optimization: {
    minimizer: [
      new UglifyJsPlugin({ uglifyOptions: { compress: { collapse_vars: false }}})
    ]
  }
});
