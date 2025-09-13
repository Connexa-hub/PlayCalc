import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
  BannerAd as RNBannerAd,
  BannerAdSize,
  TestIds,
} from 'react-native-google-mobile-ads';
import Constants from 'expo-constants';

const adUnitId =
  __DEV__
    ? TestIds.BANNER
    : Constants.expoConfig?.extra?.AD_BANNER_ID ?? '';

interface BannerAdProps {
  style?: StyleProp<ViewStyle>;
}

const BannerAd: React.FC<BannerAdProps> = ({ style }) => {
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
