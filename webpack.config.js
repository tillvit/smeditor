const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const WebpackBarPlugin = require('webpackbar');
const path = require('path');

module.exports = {
  entry: './src/App.ts',
  mode: "production",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    compress: true,
    liveReload: false,
    watchFiles: ['./src/**/*.ts'],
    static: {
      directory: path.join(__dirname, '.'),
    },
    client: {
      logging: 'info',
      progress: true,
    },
    devMiddleware: {
      writeToDisk: true,
    },
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static' }
      ]
    }),
    new CleanWebpackPlugin({
      root: path.resolve('.'),
    }),
    new WebpackBarPlugin()
  ],
};