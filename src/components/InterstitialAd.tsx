import { Platform } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-1825209738194679/1853394606',
      android: 'ca-app-pub-1825209738194679/1853394606',
    }) || TestIds.INTERSTITIAL;

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

let isLoaded = false;
let isLoading = false;

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  isLoaded = true;
  isLoading = false;
});

interstitial.addAdEventListener(AdEventType.CLOSED, () => {
  isLoaded = false;
  loadInterstitial();
});

interstitial.addAdEventListener(AdEventType.ERROR, () => {
  isLoaded = false;
  isLoading = false;
});

function loadInterstitial() {
  if (!isLoaded && !isLoading) {
    isLoading = true;
    interstitial.load();
  }
}

export function showInterstitial() {
  if (isLoaded) {
    interstitial.show();
  } else {
    loadInterstitial();
  }
}

loadInterstitial();
