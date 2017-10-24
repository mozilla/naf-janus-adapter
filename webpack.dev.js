const path = require("path");
const merge = require("webpack-merge");
const common = require("./webpack.common");

module.exports = merge(common, {
  devtool: "inline-source-map",
  devServer: {
    publicPath: "/dist/",
    contentBase: path.resolve(__dirname, "examples")
  }
});
