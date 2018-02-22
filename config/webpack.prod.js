const webpack = require('webpack');
const merge = require('webpack-merge');

const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const baseConfig = require('./webpack.base.js');

module.exports = merge(baseConfig, {
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new LodashModuleReplacementPlugin({
      // Iteratee shorthands for _.property, _.matches, & _.matchesProperty
      shorthands: true,
      // Support “clone” methods & cloning source objects
      cloning: false,
      // Support “curry” methods
      currying: false,
      // Caches for methods like _.cloneDeep, _.isEqual, & _.uniq
      caching: false,
      // Support objects in “Collection” methods
      collections: true,
      // Support objects like buffers, maps, sets, symbols, typed arrays, etc
      exotics: false,
      // Guards for host objects, sparse arrays, & other edge cases
      guards: false,
      // Metadata to reduce wrapping
      // of bound, curried, & partially applied functions (requires currying)
      metadata: false,
      // Support deburring letters
      deburring: false,
      // Support Unicode symbols
      unicode: false,
      // Components to support chain sequences
      chaining: false,
      // Support _.memoize & memoization
      memoizing: true,
      // Support for coercing values to integers, numbers, & strings
      coercions: false,
      // Support “flatten” methods & flattening rest arguments
      flattening: false,
      // Deep property path support for methods like _.get, _.has, & _.set
      paths: true,
      // Argument placeholder support
      // for “bind”, “curry”, & “partial” methods (requires currying)
      placeholders: false,
    }),
    new UglifyJsPlugin({
      exclude: /sql/,
      sourceMap: true,

      cache: true,
      parallel: true,

      uglifyOptions: {
        ecma: 8,
        ie8: false,
        safari10: true,

        toplevel: true,
        compress: {
          warnings: false,

          dead_code: true,
          pure_funcs: [
            'console.log',
            'console.group',
            'console.groupCollapsed',
            'console.groupEnd',
          ],
        },
        mangle: {
          keep_fnames: false,
          reserved: ['exports', 'require'],
        },
        output: {
          comments: false,
        },
      },
    }),
    new UglifyJsPlugin({
      test: /sql/,
      sourceMap: false,

      uglifyOptions: {
        compress: false,
        output: {
          comments: false,
        },
      },
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle.report.html',
    }),
  ],
});
