import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';

const BANNER_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111'
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';

export default function BannerAd({ style = {} }) {
  return (
    <View style={[styles.container, style]}>
      <AdMobBanner
        bannerSize="smartBannerPortrait"
        adUnitID={BANNER_ID}
        servePersonalizedAds
        onDidFailToReceiveAdWithError={err => console.log('Ad error:', err)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 0,
    backgroundColor: 'transparent',
  },
});
