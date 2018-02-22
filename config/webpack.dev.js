const webpack = require('webpack');
const merge = require('webpack-merge');

const FriendlyErrors = require('friendly-errors-webpack-plugin');

const chalk = require('chalk');

const baseConfig = require('./webpack.base.js');
const settings = require('./project.js').dev;

module.exports = merge(baseConfig, {
  devServer: {
    port: settings.port,
    host: settings.host,
    https: true,
    allowedHosts: [
      'dev.test',
    ],

    compress: true,

    noInfo: true,
    quiet: true,
    historyApiFallback: true,
  },
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new FriendlyErrors({
      compilationSuccessInfo: {
        messages: [
          chalk`Your application is accessible at {green ${`https://${settings.host}:${settings.port}/`}}`,
          chalk`Output is served from {magenta /}`,
          chalk`404s will fallback to {magenta /index.html}`,
        ],
        notes: [
          'Note that the development build is not optimized.',
          chalk`To create a production build, use {bgYellow.black  npm run build }`,
          chalk`Stop the server with {bgRed.black  Ctrl-C }`,
        ],
      },
    }),
  ],
});
