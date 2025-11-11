const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

const withAdMob = (config, { androidAppId, iosAppId }) => {
  // Configure Android
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Remove existing AdMob meta-data if present
    if (mainApplication['meta-data']) {
      mainApplication['meta-data'] = mainApplication['meta-data'].filter(
        (item) => 
          item.$['android:name'] !== 'com.google.android.gms.ads.APPLICATION_ID' &&
          item.$['android:name'] !== 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT'
      );
    } else {
      mainApplication['meta-data'] = [];
    }

    // Add AdMob meta-data with tools:replace
    mainApplication['meta-data'].push(
      {
        $: {
          'android:name': 'com.google.android.gms.ads.APPLICATION_ID',
          'android:value': androidAppId,
          'tools:replace': 'android:value'
        }
      },
      {
        $: {
          'android:name': 'com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT',
          'android:value': 'true',
          'tools:replace': 'android:value'
        }
      }
    );

    // Ensure tools namespace is declared
    if (!androidManifest.manifest.$['xmlns:tools']) {
      androidManifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    return config;
  });

  // Configure iOS
  config = withInfoPlist(config, (config) => {
    config.modResults.GADApplicationIdentifier = iosAppId;
    config.modResults.GADIsAdManagerApp = true;
    return config;
  });

  return config;
};

module.exports = withAdMob;
