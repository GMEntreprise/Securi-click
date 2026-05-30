import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  resources,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from './resources';

export function initI18n(language: SupportedLanguage = DEFAULT_LANGUAGE) {
  if (i18n.isInitialized) {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
    return;
  }

  i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'parent',
      'collector',
      'school',
      'notifications',
      'errors',
    ],
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export { i18n };
export type { SupportedLanguage };
