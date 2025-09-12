import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'YOUR_REAL_INTERSTITIAL_AD_UNIT_ID';

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
