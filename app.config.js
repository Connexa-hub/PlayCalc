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
    // <-- add this plugin
    "expo-build-properties",
  ],
  extra: {
    API_KEY: process.env.API_KEY,
    eas: {
      projectId: "f8436d95-c601-4813-b055-90f81ea85d6c",
    },
  },
  owner: "connexa",
});
