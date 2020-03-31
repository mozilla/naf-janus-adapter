const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  mode: "production",
  output: {
    filename: "naf-janus-adapter.min.js"
  },
  devtool: "source-map"
});
