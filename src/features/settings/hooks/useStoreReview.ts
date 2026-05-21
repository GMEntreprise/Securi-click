import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { reviewFrequencyService } from '../services/reviewFrequency.service';
import { storeReviewService } from '../services/storeReview.service';

type ReviewState = 'idle' | 'requesting' | 'done' | 'blocked';

export interface UseStoreReviewReturn {
  reviewState: ReviewState;
  request: () => Promise<void>;
}

export function useStoreReview(): UseStoreReviewReturn {
  const [reviewState, setReviewState] = useState<ReviewState>('idle');

  const request = useCallback(async () => {
    if (reviewState === 'requesting') return;

    if (__DEV__) console.log('[StoreReview] button pressed');

    const freq = await reviewFrequencyService.getState();

    if (!freq.canAsk) {
      if (__DEV__) console.log('[StoreReview] blocked by frequency guard');
      setReviewState('blocked');
      setTimeout(() => setReviewState('idle'), 2000);
      return;
    }

    setReviewState('requesting');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await storeReviewService.request();
      await reviewFrequencyService.record();
      if (__DEV__) console.log('[StoreReview] result:', result.method);
      setReviewState('done');
      setTimeout(() => setReviewState('idle'), 3000);
    } catch (e) {
      if (__DEV__) console.error('[StoreReview] error:', e);
      setReviewState('idle');
    }
  }, [reviewState]);

  return { reviewState, request };
}
