// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Redirect react-native-iap to our wrapper that handles Expo Go gracefully
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // 'react-native-iap': path.resolve(__dirname, 'services/iap-wrapper.js'),
};

module.exports = config;
