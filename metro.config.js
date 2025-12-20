const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
        if (moduleName === './components/AnimatedThreeDBar' && context.originModulePath.includes('gifted-charts-core')) {
            const ctx = { ...context, resolveRequest: null };
            return context.resolveRequest(ctx, moduleName + '/index.js', platform);
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-linear-gradient': require('path').resolve(__dirname, 'components/LinearGradientShim.js'),
};

module.exports = withNativeWind(config, { input: "./global.css" });
