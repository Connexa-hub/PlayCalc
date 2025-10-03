import {
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.OS === 'ios'
  ? process.env.IOS_INTERSTITIAL_AD_UNIT_ID // your iOS ad unit ID
  : process.env.ANDROID_INTERSTITIAL_AD_UNIT_ID; // your Android ad unit ID

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