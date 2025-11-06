const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
  process: require.resolve('process/browser'),
  stream: require.resolve('readable-stream'),
};

module.exports = config;
