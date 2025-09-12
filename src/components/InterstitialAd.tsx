import { AdMobInterstitial } from 'expo-ads-admob';

const INTERSTITIAL_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712'
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';

export async function showInterstitial() {
  try {
    await AdMobInterstitial.setAdUnitID(INTERSTITIAL_ID);
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  } catch (e) {
    console.log('Interstitial Ad error:', e);
  }
}
