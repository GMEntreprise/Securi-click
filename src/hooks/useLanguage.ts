import { useLanguageStore } from '@/stores/language.store';
import type { SupportedLanguage } from '@/i18n';

export function useLanguage() {
  const { language, setLanguage } = useLanguageStore();
  return { language, setLanguage } as {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
  };
}
