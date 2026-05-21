import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_LAST_ASKED = '@securiclick/review_last_asked_at';
const KEY_ASK_COUNT = '@securiclick/review_ask_count';

const MIN_DAYS_BETWEEN = 30;

export interface ReviewFrequencyState {
  askCount: number;
  lastAskedAt: string | null;
  canAsk: boolean;
}

export const reviewFrequencyService = {
  async getState(): Promise<ReviewFrequencyState> {
    const [rawCount, rawDate] = await AsyncStorage.multiGet([
      KEY_ASK_COUNT,
      KEY_LAST_ASKED,
    ]);
    const askCount = parseInt(rawCount[1]?.[1] ?? '0', 10);
    const lastAskedAt = rawDate[1]?.[1] ?? null;

    let canAsk = true;
    if (lastAskedAt) {
      const daysSince =
        (Date.now() - new Date(lastAskedAt).getTime()) / (1000 * 60 * 60 * 24);
      canAsk = daysSince >= MIN_DAYS_BETWEEN;
    }

    return { askCount, lastAskedAt, canAsk };
  },

  async record(): Promise<void> {
    const state = await reviewFrequencyService.getState();
    await AsyncStorage.multiSet([
      [KEY_ASK_COUNT, String(state.askCount + 1)],
      [KEY_LAST_ASKED, new Date().toISOString()],
    ]);
  },

  async reset(): Promise<void> {
    await AsyncStorage.multiRemove([KEY_ASK_COUNT, KEY_LAST_ASKED]);
  },
};
