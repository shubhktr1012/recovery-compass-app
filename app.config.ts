import type { ConfigContext, ExpoConfig } from 'expo/config';

type ExpoPlugin = NonNullable<ExpoConfig['plugins']>[number];
type ExpoPlugins = NonNullable<ExpoConfig['plugins']>;

export default ({ config }: ConfigContext): ExpoConfig => {
  const baseConfig = config as ExpoConfig;
  const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? process.env.EAS_PROJECT_ID ?? undefined;
  const basePlugins = baseConfig.plugins ?? [];
  const audioPluginConfig: [string, Record<string, unknown>] = [
    'expo-audio',
    {
      enableBackgroundPlayback: true,
      microphonePermission: false,
      recordAudioAndroid: false,
    },
  ];
  const withAudioSafetyConfig = (plugin: ExpoPlugin): ExpoPlugin => {
    if (plugin === 'expo-audio') {
      return audioPluginConfig;
    }

    if (Array.isArray(plugin) && plugin[0] === 'expo-audio') {
      return [
        'expo-audio',
        {
          ...(plugin[1] ?? {}),
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ];
    }

    return plugin;
  };
  const hasAudioPlugin = basePlugins.some(
    (plugin) => plugin === 'expo-audio' || (Array.isArray(plugin) && plugin[0] === 'expo-audio')
  );
  const plugins = hasAudioPlugin
    ? basePlugins.map(withAudioSafetyConfig)
    : ([...basePlugins, audioPluginConfig] as ExpoPlugins);

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
