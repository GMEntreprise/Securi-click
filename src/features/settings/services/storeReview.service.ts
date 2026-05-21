import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';

const STORE_URLS = {
  ios: 'https://apps.apple.com/app/idXXXXXXXXX',
  android: 'https://play.google.com/store/apps/details?id=com.securiclick.app',
} as const;

export interface StoreReviewResult {
  method: 'native' | 'fallback' | 'unavailable';
}

export const storeReviewService = {
  async isNativeAvailable(): Promise<boolean> {
    return StoreReview.isAvailableAsync();
  },

  async requestNative(): Promise<void> {
    await StoreReview.requestReview();
  },

  async openStorePage(): Promise<void> {
    const url = Platform.OS === 'ios' ? STORE_URLS.ios : STORE_URLS.android;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else if (__DEV__) {
      console.warn('[StoreReview] Cannot open store URL:', url);
    }
  },

  async request(): Promise<StoreReviewResult> {
    const available = await storeReviewService.isNativeAvailable();

    if (available) {
      if (__DEV__) console.log('[StoreReview] native prompt requested');
      await storeReviewService.requestNative();
      return { method: 'native' };
    }

    if (__DEV__) console.log('[StoreReview] fallback — opening store page');
    await storeReviewService.openStorePage();
    return { method: 'fallback' };
  },
};
