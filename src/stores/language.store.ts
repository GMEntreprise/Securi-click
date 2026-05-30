import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { i18n, initI18n, type SupportedLanguage } from '@/i18n';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/i18n/resources';

const LANGUAGE_KEY = 'app-language-v1';

function detectSystemLanguage(): SupportedLanguage {
  const locales = getLocales();
  const tag = locales[0]?.languageTag ?? '';
  const code = tag.split('-')[0]?.toLowerCase() ?? '';
  return (SUPPORTED_LANGUAGES as string[]).includes(code)
    ? (code as SupportedLanguage)
    : DEFAULT_LANGUAGE;
}

interface LanguageState {
  language: SupportedLanguage;
  isReady: boolean;
  initialize: () => Promise<void>;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: DEFAULT_LANGUAGE,
  isReady: false,

  initialize: async () => {
    if (get().isReady) return;
    let lang: SupportedLanguage;
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      lang =
        stored && (SUPPORTED_LANGUAGES as string[]).includes(stored)
          ? (stored as SupportedLanguage)
          : detectSystemLanguage();
    } catch {
      lang = detectSystemLanguage();
    }
    initI18n(lang);
    set({ language: lang, isReady: true });
  },

  setLanguage: async (lang: SupportedLanguage) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    i18n.changeLanguage(lang);
    set({ language: lang });
  },
}));
