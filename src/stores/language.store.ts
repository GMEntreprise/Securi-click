import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '@/i18n';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from '@/i18n/resources';

function detectSystemLanguage(): SupportedLanguage {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getLocales } = require('expo-localization') as {
      getLocales: () => { languageTag: string }[];
    };
    const tag = getLocales()[0]?.languageTag ?? '';
    const code = tag.split('-')[0]?.toLowerCase() ?? '';
    return (SUPPORTED_LANGUAGES as string[]).includes(code)
      ? (code as SupportedLanguage)
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

interface LanguageState {
  language: SupportedLanguage;
  isReady: boolean;
  initialize: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: DEFAULT_LANGUAGE,
      isReady: false,

      initialize: async () => {
        if (get().isReady) return;
        // Language already rehydrated from AsyncStorage by persist middleware.
        // Just detect system language as fallback if still on default.
        const current = get().language;
        const lang =
          current !== DEFAULT_LANGUAGE ? current : detectSystemLanguage();
        await i18n.changeLanguage(lang);
        set({ language: lang, isReady: true });
      },

      setLanguage: async (lang: SupportedLanguage) => {
        await i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'app-language-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({ language: state.language }),
      onRehydrateStorage: () => state => {
        // Sync i18next as soon as persist rehydrates (before first render)
        if (state?.language) {
          i18n.changeLanguage(state.language);
        }
      },
    }
  )
);

// Selectors
export const useLanguage = () => useLanguageStore(s => s.language);
export const useIsLanguageReady = () => useLanguageStore(s => s.isReady);
export const useSetLanguage = () => useLanguageStore(s => s.setLanguage);
