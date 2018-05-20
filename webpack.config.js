/* eslint import/no-extraneous-dependencies: ["error", { devDependencies: true }] */

const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const ZipPlugin = require('./plugins/zip')

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    content: './src/content/index.jsx',
    options: './src/options/index.jsx'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          plugins: [
            ['syntax-object-rest-spread'],
            ['transform-class-properties'],
            ['transform-react-jsx', { pragma: 'h' }]
          ]
        }
      },
      {
        test: /\.sass$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  devtool: false,
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new CopyPlugin([
      { from: 'manifest.json' },
      { from: 'icons', to: 'icons' },
      { from: '_locales', to: '_locales' },
      { from: 'src/options/index.html', to: 'options.html' }
    ]),
    new ZipPlugin({ path: 'taptranslate@vldkn.net.xpi' })
  ]
}
