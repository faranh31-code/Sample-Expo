import React from 'react';
import { AppState, AppStateStatus, InteractionManager, Platform, StyleSheet, View } from 'react-native';
import {
  AdEventType,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  MobileAds,
  RewardedAd,
  RewardedAdEventType,
  TestIds
} from 'react-native-google-mobile-ads';

// Real production Ad Unit IDs
const AD_UNIT_IDS = {
  BANNER: {
    ios: 'ca-app-pub-4386055252112057/4198532826',
    android: 'ca-app-pub-4386055252112057/9837872317',
  },
  INTERSTITIAL: {
    ios: 'ca-app-pub-4386055252112057/4557625473',
    android: 'ca-app-pub-4386055252112057/9484973937',
  },
  REWARDED: {
    ios: 'ca-app-pub-4386055252112057/2885451159',
    android: 'ca-app-pub-4386055252112057/2845088559',
  },
  APP_OPEN: {
    ios: 'ca-app-pub-4386055252112057/4299547128',
    android: 'ca-app-pub-4386055252112057/8524790649',
  },
};

const TEST_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED: TestIds.REWARDED,
  APP_OPEN: TestIds.APP_OPEN,
} as const;

// Get platform-specific ad unit ID
const getAdUnitId = (adType: keyof typeof AD_UNIT_IDS): string => {
  const ids = AD_UNIT_IDS[adType];
  const platformId = Platform.select(ids);
  return platformId || TEST_IDS[adType];
};

// Export ad unit IDs
export const BANNER_AD_UNIT_ID = getAdUnitId('BANNER');
export const INTERSTITIAL_AD_UNIT_ID = getAdUnitId('INTERSTITIAL');
export const REWARDED_AD_UNIT_ID = getAdUnitId('REWARDED');
export const APP_OPEN_AD_UNIT_ID = getAdUnitId('APP_OPEN');

// Interstitial Ad
let interstitialAd: InterstitialAd | null = null;
let isInterstitialLoaded = false;
let interstitialUnsubscribers: Array<() => void> = [];

export const loadInterstitialAd = () => {
  if (AppState.currentState !== 'active') return;
  InteractionManager.runAfterInteractions(() => {
    try {
      // cleanup previous listeners
      if (interstitialUnsubscribers.length) {
        interstitialUnsubscribers.forEach((u) => {
          try { u(); } catch {}
        });
        interstitialUnsubscribers = [];
      }

      interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID);
      
      const unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        isInterstitialLoaded = true;
      });

      const unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        isInterstitialLoaded = false;
        // small delay to avoid race during screen transitions
        setTimeout(() => loadInterstitialAd(), 500);
      });

      interstitialUnsubscribers.push(unsubscribeLoaded, unsubscribeClosed);

      interstitialAd.load();
    } catch (error) {
      console.error('Error loading interstitial ad:', error);
    }
  });
};

export const showInterstitialAd = async (): Promise<boolean> => {
  if (AppState.currentState !== 'active') return false;
  if (isInterstitialLoaded && interstitialAd) {
    try {
      await interstitialAd.show();
      // reset state and schedule reload
      isInterstitialLoaded = false;
      setTimeout(() => loadInterstitialAd(), 500);
      return true;
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      return false;
    }
  }
  return false;
};

// Rewarded Ad
let rewardedAd: RewardedAd | null = null;
let isRewardedLoaded = false;
let rewardedUnsubscribers: Array<() => void> = [];

export const loadRewardedAd = () => {
  if (AppState.currentState !== 'active') return;
  InteractionManager.runAfterInteractions(() => {
    try {
      // cleanup previous listeners
      if (rewardedUnsubscribers.length) {
        rewardedUnsubscribers.forEach((u) => {
          try { u(); } catch {}
        });
        rewardedUnsubscribers = [];
      }

      rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);
      
      const unsubscribeLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
        isRewardedLoaded = true;
      });

      const unsubscribeEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        isRewardedLoaded = false;
        setTimeout(() => loadRewardedAd(), 500);
      });

      rewardedUnsubscribers.push(unsubscribeLoaded, unsubscribeEarned);

      rewardedAd.load();
    } catch (error) {
      console.error('Error loading rewarded ad:', error);
    }
  });
};

export const showRewardedAd = async (): Promise<boolean> => {
  if (AppState.currentState !== 'active') return false;
  if (isRewardedLoaded && rewardedAd) {
    try {
      await rewardedAd.show();
      isRewardedLoaded = false;
      setTimeout(() => loadRewardedAd(), 500);
      return true;
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      return false;
    }
  }
  return false;
};

// Initialize Mobile Ads SDK
let isInitialized = false;

export const initMobileAds = async () => {
  if (isInitialized) {
    return;
  }

  try {
    await MobileAds().initialize();
    isInitialized = true;
    console.log('AdMob SDK initialized successfully');
    
    // Load ads after initialization with a delay and after interactions
    const run = () => {
      try {
        loadInterstitialAd();
        loadRewardedAd();
      } catch (error) {
        console.error('Error loading ads:', error);
      }
    };
    InteractionManager.runAfterInteractions(() => setTimeout(run, 600));
  } catch (error) {
    console.error('Error initializing AdMob SDK:', error);
  }
};

export const initMobileAdsSafe = () => {
  if (isInitialized) return;
  const start = () => InteractionManager.runAfterInteractions(() => initMobileAds());
  if (AppState.currentState === 'active') {
    start();
    return;
  }
  const handler = (state: AppStateStatus) => {
    if (state === 'active') {
      AppState.removeEventListener('change', handler as any);
      start();
    }
  };
  // @ts-ignore React Native supports addEventListener('change', ...)
  AppState.addEventListener('change', handler);
};

// Legacy function name for backward compatibility
export const initAds = initMobileAdsSafe;

// Banner Ad Component
export const AdBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
});
