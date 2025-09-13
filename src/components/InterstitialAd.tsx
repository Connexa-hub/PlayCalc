import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const adUnitId =
  __DEV__
    ? TestIds.INTERSTITIAL
    : Constants.expoConfig?.extra?.AD_INTERSTITIAL_ID ?? '';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

let isLoaded = false;

// Preload the interstitial
interstitial.load();

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  isLoaded = true;
});

interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  isLoaded = false;
  interstitial.load(); // Reload for next time
});

export const showInterstitial = () => {
  if (isLoaded) {
    interstitial.show();
  }
};
