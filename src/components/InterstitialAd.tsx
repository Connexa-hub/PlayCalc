import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : process.env.ADMOB_INTERSTITIAL_AD_ID;

let interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const loadInterstitial = () => {
  const unsubscribe = interstitial.addAdEventListener(
    AdEventType.LOADED,
    () => {
      console.log('Interstitial ad loaded');
    }
  );
  interstitial.load();
  return unsubscribe;
};

export const showInterstitial = () => {
  if (interstitial.loaded) {
    interstitial.show();
    // Create a new ad request for the next time
    interstitial = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
    });
    loadInterstitial();
  } else {
    console.log('Interstitial ad not loaded yet');
  }
};

// Load the first ad
loadInterstitial();