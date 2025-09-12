import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd as RNBannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.BANNER : 'YOUR_REAL_BANNER_AD_UNIT_ID';

const BannerAd: React.FC<{ style?: any }> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <RNBannerAd unitId={adUnitId} size={BannerAdSize.BANNER} />
    </View>
  );
};

export default BannerAd;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
