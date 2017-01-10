module.exports = {
  entry: './handler.js',
  target: 'node',
  // AWS Lambda Available Libraries
  externals: { 'aws-sdk': 'aws-sdk' },
  module: {
    preLoaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint',
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel',
    }],
  },
};
