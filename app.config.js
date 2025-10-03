export default ({ config }) => ({
  ...config,
  name: "PlayCalc",
  slug: "PlayCalc",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png", // Homescreen app icon
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/connexa.png", // Branding logo before splash screen
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    icon: "./assets/icon.png", // Keep original icon for iOS homescreen
    config: {
      googleMobileAdsAppId: process.env.ADMOB_APP_ID,
    },
  },
  android: {
    package: "com.connexa.playcalc",
    icon: "./assets/icon.png", // Original homescreen icon
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon-foreground.png",
      backgroundColor: "#000000",
    },
    edgeToEdgeEnabled: true,
    config: {
      googleMobileAdsAppId: process.env.ADMOB_APP_ID,
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: ["react-native-google-mobile-ads"],
  extra: {
    API_KEY: process.env.API_KEY,
    eas: {
      projectId: "f8436d95-c601-4813-b055-90f81ea85d6c",
    },
  },
  owner: "connexa",
});
