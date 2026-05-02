const { withAndroidManifest, withAndroidStyles } = require('expo/config-plugins');

const NOTIFICATIONS_BOOT_RECEIVER = 'expo.modules.notifications.service.NotificationsService';
const AUDIO_RECORDING_SERVICE = 'expo.modules.audio.service.AudioRecordingService';

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

module.exports = function withAndroidCompliance(config) {
  config = withAndroidManifest(config, (modConfig) => {
    const manifestRoot = modConfig.modResults;
    const applications = asArray(manifestRoot.manifest.application);
    const application = applications[0];

    if (!application) {
      return modConfig;
    }

    const activities = asArray(application.activity);
    const mainActivity = activities.find((activity) => activity?.$?.['android:name'] === '.MainActivity') ?? activities[0];

    if (mainActivity?.$?.['android:screenOrientation']) {
      delete mainActivity.$['android:screenOrientation'];
    }

    const receivers = asArray(application.receiver).filter(
      (receiver) => receiver?.$?.['android:name'] !== NOTIFICATIONS_BOOT_RECEIVER
    );

    if (receivers.length > 0) {
      application.receiver = receivers;
    } else {
      delete application.receiver;
    }

    const services = asArray(application.service).filter(
      (service) => service?.$?.['android:name'] !== AUDIO_RECORDING_SERVICE
    );

    if (services.length > 0) {
      application.service = services;
    } else {
      delete application.service;
    }

    return modConfig;
  });

  config = withAndroidStyles(config, (modConfig) => {
    const styleResources = asArray(modConfig.modResults.resources.style);
    const appTheme = styleResources.find((style) => style?.$?.name === 'AppTheme');

    if (appTheme) {
      appTheme.item = asArray(appTheme.item).filter(
        (item) => item?.$?.name !== 'android:statusBarColor'
      );
    }

    return modConfig;
  });

  return config;
};
