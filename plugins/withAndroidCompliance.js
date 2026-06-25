const { withAndroidManifest, withAndroidStyles, withMainActivity } = require('expo/config-plugins');

const NOTIFICATIONS_BOOT_RECEIVER = 'expo.modules.notifications.service.NotificationsService';
const AUDIO_RECORDING_SERVICE = 'expo.modules.audio.service.AudioRecordingService';
const BARCODE_SCANNER_DELEGATE_ACTIVITY =
  'com.google.mlkit.vision.codescanner.internal.GmsBarcodeScanningDelegateActivity';
const FLAG_SECURE_IMPORT = 'import android.view.WindowManager';
const FLAG_SECURE_BLOCK = `    // Recovery content is private. Block screenshots, screen recording,
    // and recent-app previews on Android.
    window.setFlags(
      WindowManager.LayoutParams.FLAG_SECURE,
      WindowManager.LayoutParams.FLAG_SECURE
    )

`;

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

module.exports = function withAndroidCompliance(config) {
  config = withMainActivity(config, (modConfig) => {
    if (modConfig.modResults.language !== 'kt') {
      return modConfig;
    }

    let contents = modConfig.modResults.contents;

    if (!contents.includes(FLAG_SECURE_IMPORT)) {
      contents = contents.replace('import android.os.Bundle', `import android.os.Bundle\n${FLAG_SECURE_IMPORT}`);
    }

    if (!contents.includes('WindowManager.LayoutParams.FLAG_SECURE')) {
      contents = contents.replace(
        /(override fun onCreate\(savedInstanceState: Bundle\?\) \{\n)/,
        `$1${FLAG_SECURE_BLOCK}`
      );
    }

    modConfig.modResults.contents = contents;
    return modConfig;
  });

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

    const barcodeScannerDelegateActivity = activities.find(
      (activity) => activity?.$?.['android:name'] === BARCODE_SCANNER_DELEGATE_ACTIVITY
    );

    if (barcodeScannerDelegateActivity?.$?.['android:screenOrientation']) {
      delete barcodeScannerDelegateActivity.$['android:screenOrientation'];
    }

    if (!barcodeScannerDelegateActivity) {
      activities.push({
        $: {
          'android:name': BARCODE_SCANNER_DELEGATE_ACTIVITY,
          'tools:remove': 'android:screenOrientation',
        },
      });
      application.activity = activities;
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
