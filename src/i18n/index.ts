import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources, DEFAULT_LANGUAGE } from './resources';

// Initialized synchronously at module load so t() is always safe on first render
i18n.use(initReactI18next).init({
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
  interpolation: { escapeValue: false },
});

export { i18n };
export type { SupportedLanguage } from './resources';
