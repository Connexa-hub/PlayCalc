import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

const adUnitId = __DEV__
  ? TestIds.REWARDED
  : Platform.OS === 'ios'
  ? process.env.IOS_REWARDED_AD_UNIT_ID // your iOS ad unit ID
  : process.env.ANDROID_REWARDED_AD_UNIT_ID; // your Android ad unit ID

let rewarded = RewardedAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});

const loadRewardedAd = () => {
  const unsubscribeLoaded = rewarded.addAdEventListener(
    RewardedAdEventType.LOADED,
    () => {
      console.log('Rewarded ad loaded');
    }
  );
  const unsubscribeEarned = rewarded.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    reward => {
      console.log('User earned reward of ', reward);
    }
  );
  rewarded.load();

  return () => {
    unsubscribeLoaded();
    unsubscribeEarned();
  };
};

export const showRewardedAd = (onRewarded: () => void) => {
  if (rewarded.loaded) {
    rewarded.show();
    const unsubscribe = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        onRewarded();
        unsubscribe();
        // Create a new ad request for the next time
        rewarded = RewardedAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
        });
        loadRewardedAd();
      }
    );
  } else {
    console.log('Rewarded ad not loaded yet');
  }
};

// Load the first ad
loadRewardedAd();