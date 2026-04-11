import type { ExpoConfig } from 'expo/config';

const appJson = require('./app.json');

export default (): ExpoConfig => {
  const baseConfig = appJson.expo as ExpoConfig;
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? process.env.EAS_PROJECT_ID ?? undefined;
  const basePlugins = baseConfig.plugins ?? [];
  const audioPluginConfig: [string, { microphonePermission: false; recordAudioAndroid: false }] = [
    'expo-audio',
    { microphonePermission: false, recordAudioAndroid: false },
  ];
  const hasAudioPlugin = basePlugins.some((plugin) => plugin === 'expo-audio' || (Array.isArray(plugin) && plugin[0] === 'expo-audio'));
  const plugins = hasAudioPlugin
    ? basePlugins.map((plugin) =>
        plugin === 'expo-audio' || (Array.isArray(plugin) && plugin[0] === 'expo-audio')
          ? audioPluginConfig
          : plugin
      )
    : [...basePlugins, audioPluginConfig];

  return {
    ...baseConfig,
    plugins,
    extra: {
      ...(baseConfig.extra ?? {}),
      ...(easProjectId
        ? {
            eas: {
              projectId: easProjectId,
            },
          }
        : {}),
    },
  };
};
