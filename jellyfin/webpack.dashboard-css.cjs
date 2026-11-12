const config = require("./webpack.prod.js");
const TerserPlugin = require("minimizer-webpack-plugin");

// Type checking runs first. Keep the bundler and minifier in one process so
// the build also fits Docker VMs with 4 GB of memory.
module.exports = {
  ...config,
  parallelism: 1,
  plugins: config.plugins.filter(
    (plugin) => plugin.constructor.name !== "ForkTsCheckerWebpackPlugin",
  ),
  optimization: {
    ...config.optimization,
    minimizer: [
      new TerserPlugin({
        parallel: false,
        terserOptions: { compress: { passes: 2 } },
      }),
    ],
  },
};
