import React from 'react';
import { Platform, StyleSheet, ViewStyle } from 'react-native';
import { BannerAd as AdMobBanner, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-1825209738194679/1794556990',
      android: 'ca-app-pub-1825209738194679/1794556990',
    }) || TestIds.ADAPTIVE_BANNER;

interface BannerAdProps {
  style?: ViewStyle;
}

export default function BannerAd({ style }: BannerAdProps) {
  return (
    <AdMobBanner
      unitId={adUnitId}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
      style={[styles.banner, style]}
    />
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
  },
});
