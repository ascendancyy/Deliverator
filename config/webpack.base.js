const webpack = require('webpack');
const path = require('path');
const dotenv = require('dotenv');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const SpritePlugin = require('svg-sprite-loader/plugin');
const WebpackNotifierPlugin = require('webpack-notifier');

const projectConfig = require('./project.js');

const PRODUCTION = process.env.NODE_ENV === 'production';
const APP_VERSION = require('../package.json').version.toString();

dotenv.config({ path: !PRODUCTION ? '.env' : '.prod.env' });

const settings = PRODUCTION ?
  projectConfig.prod :
  projectConfig.dev;

const ExternalCSS = new ExtractTextPlugin({
  filename: settings.cssFilename,
  allChunks: true,
  disable: !PRODUCTION,
});

const PostCSSLoader = {
  loader: 'postcss-loader',
  options: {
    sourceMap: true,
    config: {
      path: './postcss.config.js',
    },
  },
};

const SCSSLoader = [
  {
    loader: 'css-loader',
    options: {
      sourceMap: true,
      importLoaders: 2,
    },
  },
  PostCSSLoader,
  {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      indentedSyntax: false,
      outputStyle: settings.scssOutputStyle,
    },
  },
];

const base = {
  devtool: settings.devtool,
  recordsPath: path.resolve(__dirname, '../records.json'),
  entry: {
    app: './src/app.js',
  },
  output: {
    filename: settings.outputFilename,
    chunkFilename: settings.chunkOutputFilename,
    path: path.resolve(__dirname, '../dist'),
    publicPath: projectConfig.publicPath,
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.runtime.esm.js',

      src: path.resolve(__dirname, '../src'),
      assets: path.resolve(__dirname, '../src/assets'),

      'B.Net': path.resolve(__dirname, '../src/B.Net'),

      scss: path.resolve(__dirname, '../src/scss'),
      Snowcrash: path.resolve(__dirname, '../src/scss/Snowcrash'),

      components: path.resolve(__dirname, '../src/components'),
      views: path.resolve(__dirname, '../src/views'),
      Store: path.resolve(__dirname, '../src/Store'),
    },
    extensions: ['*', '.js', '.vue'],
  },
  node: {
    fs: 'empty',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: [{
          loader: 'vue-loader',
          options: {
            cssModules: {
              localIdentName: !PRODUCTION ?
                '[name]__[local]--[hash:base64:5]' :
                '[hash:base64:10]',
              camelCase: true,
            },
            loaders: {
              scss: ExternalCSS.extract({
                use: SCSSLoader,
                fallback: 'vue-style-loader',
              }),
            },
          },
        }],
      }, {
        test: /\.scss$/,
        oneOf: [
          {
            resource: {
              or: [
                path.resolve(__dirname, '../src/scss/Snowcrash/_variables.scss'),
                path.resolve(__dirname, '../src/scss/Snowcrash/variables'),
              ],
            },
            use: 'sass-extract-loader',
          }, {
            use: ExternalCSS.extract({
              use: SCSSLoader,
              fallback: 'style-loader',
            }),
          },
        ],
      }, {
        test: /\.css$/,
        use: ExternalCSS.extract({
          use: [
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                importLoaders: 1,
              },
            },
            PostCSSLoader,
          ],
          fallback: 'style-loader',
        }),
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          'babel-loader',
          {
            loader: 'eslint-loader',
            options: {
              emitWarning: true,
            },
          },
        ],
      }, {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-sprite-loader',
            options: {
              extract: PRODUCTION,
              spriteFilename: 'icons.svg?[hash:8]',
            },
          }, {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { removeTitle: true },
                { convertPathData: true },
                { convertTransform: true },
                { removeUselessStrokeAndFill: true },
              ],
            },
          },
        ],
      }, {
        test: /\.(png|jpg|gif)$/,
        use: [{
          loader: 'file-loader',
          options: { name: '[name].[ext]?[hash]' },
        }],
      },
    ],
  },
  plugins: [
    new WebpackNotifierPlugin({
      title: process.env.BNET_APP_NAME,
      contentImage: path.resolve(__dirname, '../logo.svg'),
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.APP_VERSION': JSON.stringify(APP_VERSION),

      'process.env.BNET_APP_NAME': JSON.stringify(process.env.BNET_APP_NAME),
      'process.env.BNET_API_KEY': JSON.stringify(process.env.BNET_API_KEY),
      'process.env.BNET_CLIENT_ID': JSON.stringify(process.env.BNET_CLIENT_ID),
      'process.env.BNET_CLIENT_SECRET': JSON.stringify(process.env.BNET_CLIENT_SECRET),
      'process.env.BNET_REDIRECT_URL': JSON.stringify(process.env.BNET_REDIRECT_URL),
    }),

    ExternalCSS,

    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks(module) {
        // This prevents stylesheet resources with the .css or .scss extension
        // from being moved from their original chunk to the vendor chunk
        if (module.resource && (/^.*\.(css|scss)$/).test(module.resource)) {
          return false;
        }
        return /node_modules/.test(module.context);
      },
    }),

    new webpack.optimize.CommonsChunkPlugin({
      async: 'common',
      minChunks: 2,
    }),

    new webpack.optimize.CommonsChunkPlugin({ name: 'manifest' }),

    new webpack.NamedModulesPlugin(),
    new webpack.NamedChunksPlugin(),

    new HTMLWebpackPlugin({
      filename: 'index.html',
      template: './src/index.ejs',
      title: process.env.BNET_APP_NAME,
      chunksSortMode: 'dependency',
      inject: true,
      minify: PRODUCTION ? {
        removeComments: true,
        collapseWhitespace: true,
        sortAttributes: true,
        sortClassName: true,
      } : false,
    }),

    new SpritePlugin(),

    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};

module.exports = base;
