import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  resources,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from './resources';

const I18N_CONFIG = {
  resources,
  lng: DEFAULT_LANGUAGE,
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
};

// Initialize synchronously at module load so t() is always safe to call on first render
i18n.use(initReactI18next).init(I18N_CONFIG);

export function initI18n(language: SupportedLanguage = DEFAULT_LANGUAGE) {
  if (i18n.language !== language) {
    i18n.changeLanguage(language);
  }
}

export { i18n };
export type { SupportedLanguage };
