const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force resolution of invariant
config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    invariant: path.resolve(__dirname, 'node_modules/invariant'),
};

module.exports = withNativeWind(config, { input: path.resolve(__dirname, 'global.css') });
