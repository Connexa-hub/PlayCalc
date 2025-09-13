export default ({ config }) => ({
  ...config,
  name: "PlayCalc",
  slug: "PlayCalc",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    icon: "./assets/icon.png",
  },
  android: {
    package: "com.connexa.playcalc",
    icon: "./assets/icon.png",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon-foreground.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: process.env.AD_APP_ID,
        iosAppId: process.env.AD_APP_ID,
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // This adds the tools:replace automatically for the meta-data conflict
          extraMetaData: {
            "com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT": {
              value: "false",
              toolsReplace: "android:value",
            },
          },
        },
      },
    ],
  ],
  extra: {
    API_KEY: process.env.API_KEY,
    AD_BANNER_ID: process.env.AD_BANNER_ID,
    AD_INTERSTITIAL_ID: process.env.AD_INTERSTITIAL_ID,
    AD_REWARDED_ID: process.env.AD_REWARDED_ID,
    eas: {
      projectId: "f8436d95-c601-4813-b055-90f81ea85d6c",
    },
  },
  owner: "connexa",
});
