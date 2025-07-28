// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for isows
config.resolver.alias = {
  ...config.resolver.alias,
  'isows': 'react-native-websocket'
};

module.exports = config;