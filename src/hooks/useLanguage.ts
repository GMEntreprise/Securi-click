import {
  useLanguageStore,
  useLanguage as useLanguageSelector,
  useSetLanguage,
} from '@/stores/language.store';
import type { SupportedLanguage } from '@/i18n';

export function useLanguage() {
  const language = useLanguageSelector();
  const setLanguage = useSetLanguage();
  return { language, setLanguage } as {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
  };
}

export { useLanguageStore };
export type { SupportedLanguage };
