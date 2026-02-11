/**
 * Expo Config Plugin: Launcher Mode
 *
 * This plugin modifies the AndroidManifest.xml to add launcher mode intent filters,
 * allowing MuslimGuard to be set as the default home screen/launcher on Android.
 *
 * When enabled, pressing the home button will return to MuslimGuard instead of
 * the default Android launcher, preventing children from exiting the app.
 *
 * Usage: Add "./plugins/with-launcher-mode" to the plugins array in app.json
 */

const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add launcher mode intent filter to MainActivity
 */
function addLauncherIntentFilter(androidManifest) {
  const { manifest } = androidManifest;

  // Ensure application array exists
  if (!manifest.application) {
    console.warn('withLauncherMode: No application found in AndroidManifest');
    return androidManifest;
  }

  const application = manifest.application[0];

  // Find MainActivity
  if (!application.activity) {
    console.warn('withLauncherMode: No activities found');
    return androidManifest;
  }

  const mainActivity = application.activity.find(
    (activity) => activity.$['android:name'] === '.MainActivity'
  );

  if (!mainActivity) {
    console.warn('withLauncherMode: MainActivity not found');
    return androidManifest;
  }

  // Ensure intent-filter array exists
  if (!mainActivity['intent-filter']) {
    mainActivity['intent-filter'] = [];
  }

  // Check if launcher intent filter already exists
  const hasLauncherFilter = mainActivity['intent-filter'].some((filter) => {
    if (!filter.category) return false;
    return filter.category.some(
      (cat) => cat.$['android:name'] === 'android.intent.category.HOME'
    );
  });

  if (hasLauncherFilter) {
    console.log('withLauncherMode: Launcher intent filter already exists');
    return androidManifest;
  }

  // Add new launcher intent filter
  mainActivity['intent-filter'].push({
    action: [
      {
        $: {
          'android:name': 'android.intent.action.MAIN',
        },
      },
    ],
    category: [
      {
        $: {
          'android:name': 'android.intent.category.HOME',
        },
      },
      {
        $: {
          'android:name': 'android.intent.category.DEFAULT',
        },
      },
    ],
  });

  console.log('withLauncherMode: Added launcher intent filter to MainActivity');

  return androidManifest;
}

/**
 * Main plugin function
 */
function withLauncherMode(config) {
  return withAndroidManifest(config, async (config) => {
    config.modResults = addLauncherIntentFilter(config.modResults);
    return config;
  });
}

module.exports = withLauncherMode;
