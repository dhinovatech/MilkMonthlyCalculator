import React from 'react';
import { Platform } from 'react-native';
import { BANNER_AD_UNIT_IDS, INTERSTITIAL_AD_UNIT_IDS } from '../constants/Ads';

let mobileAds: any = null;
let BannerAdComp: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;

try {
  // runtime require so project still works when native package isn't installed
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rnGMA = require('react-native-google-mobile-ads');
  mobileAds = rnGMA.default || rnGMA.mobileAds || rnGMA;
  BannerAdComp = rnGMA.BannerAd || rnGMA.Banner;
  BannerAdSize = rnGMA.BannerAdSize || rnGMA.BannerAdSizes;
  TestIds = rnGMA.TestIds;
  InterstitialAd = rnGMA.InterstitialAd;
  AdEventType = rnGMA.AdEventType;
} catch (e) {
  // package not installed; degrade gracefully
}

const getBannerUnitId = () => {
  return Platform.select({
    ios: BANNER_AD_UNIT_IDS.ios,
    android: BANNER_AD_UNIT_IDS.android,
    web: BANNER_AD_UNIT_IDS.web,
  }) as string;
};

const getInterstitialUnitId = () => {
  return Platform.select({
    ios: INTERSTITIAL_AD_UNIT_IDS.ios,
    android: INTERSTITIAL_AD_UNIT_IDS.android,
    web: INTERSTITIAL_AD_UNIT_IDS.web,
  }) as string;
};

export async function setupAdMobTestDevice() {
  if (!mobileAds) return;
  try {
    await mobileAds().initialize();
    // If API exists, set test device ids
    if (mobileAds().setRequestConfiguration) {
      try {
        mobileAds().setRequestConfiguration({
          // EMULATOR is commonly recognized by ad SDKs
          testDeviceIdentifiers: ['EMULATOR'],
        });
      } catch (e) {
        // ignore
      }
    }
  } catch (e) {
    // ignore
  }
}

export async function prepareAndShowInterstitial() {
  if (!InterstitialAd || !mobileAds) return false;
  try {
    const unitId = __DEV__ && TestIds && TestIds.INTERSTITIAL ? TestIds.INTERSTITIAL : getInterstitialUnitId();
    const interstitial = InterstitialAd.createForAdRequest(unitId, {});
    interstitial.load();
    return await new Promise<boolean>((resolve) => {
      const listener = interstitial.onAdEvent((type: any, error?: any) => {
        if (type === AdEventType.LOADED) {
          try { interstitial.show(); } catch (e) {}
        }
        if (type === AdEventType.CLOSED) {
          listener();
          resolve(true);
        }
        if (type === AdEventType.ERROR) {
          listener();
          resolve(false);
        }
      });
    });
  } catch (e) {
    return false;
  }
}

export const Banner: React.FC<{ style?: any }> = ({ style }) => {
  if (!BannerAdComp) return null;
  const unitId = __DEV__ && TestIds && TestIds.BANNER ? TestIds.BANNER : getBannerUnitId();
  try {
    const size = (BannerAdSize && BannerAdSize.SMART_BANNER) || BannerAdSize || 'SMART_BANNER';
    return <BannerAdComp unitId={unitId} size={size} style={style} />;
  } catch (e) {
    return null;
  }
};

export const isAdMobAvailable = () => !!mobileAds && !!BannerAdComp && !!InterstitialAd;

export default {
  setupAdMobTestDevice,
  prepareAndShowInterstitial,
  Banner,
  isAdMobAvailable,
};
