import React, { useEffect, useState } from 'react';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const adUnitId =
  __DEV__
    ? TestIds.REWARDED
    : Constants.expoConfig?.extra?.AD_REWARDED_ID ?? '';

let rewardedAd: RewardedAd | null = null;

if (adUnitId) {
  rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
    requestNonPersonalizedAdsOnly: true,
  });
}

export const useRewardedAd = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!rewardedAd) return;

    const load = () => rewardedAd?.load();

    const onLoaded = rewardedAd?.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setLoaded(true)
    );

    const onClosed = rewardedAd?.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
        setLoaded(false);
        load();
      }
    );

    // Initial load
    load();

    return () => {
      onLoaded?.remove();
      onClosed?.remove();
    };
  }, []);

  const show = () =>
    new Promise<void>((resolve, reject) => {
      if (!rewardedAd) {
        reject(new Error('RewardedAd not initialized'));
        return;
      }

      if (loaded) {
        rewardedAd.show();
        resolve();
      } else {
        reject(new Error('RewardedAd not loaded yet'));
      }
    });

  return { loaded, show };
};
