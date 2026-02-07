const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

// Get the default Expo config
const config = getDefaultConfig(__dirname);

// Add woff2 to assetExts
config.resolver.assetExts.push('woff2');

// Export with NativeWind configuration
module.exports = withNativeWind(config, { input: './global.css' });
