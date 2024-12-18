const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "paste.js",
    path: path.resolve(__dirname, ""),
  },
  mode: "production",
  plugins: [
    new webpack.BannerPlugin({
      banner: "MIT License Copyright Louis Li 2024",
      raw: false,
    }),
  ],
};
