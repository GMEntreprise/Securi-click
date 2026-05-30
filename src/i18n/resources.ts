import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frParent from './locales/fr/parent.json';
import frCollector from './locales/fr/collector.json';
import frSchool from './locales/fr/school.json';
import frNotifications from './locales/fr/notifications.json';
import frErrors from './locales/fr/errors.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enParent from './locales/en/parent.json';
import enCollector from './locales/en/collector.json';
import enSchool from './locales/en/school.json';
import enNotifications from './locales/en/notifications.json';
import enErrors from './locales/en/errors.json';

export const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    parent: frParent,
    collector: frCollector,
    school: frSchool,
    notifications: frNotifications,
    errors: frErrors,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    parent: enParent,
    collector: enCollector,
    school: enSchool,
    notifications: enNotifications,
    errors: enErrors,
  },
} as const;

export type SupportedLanguage = keyof typeof resources;
export type Namespace = keyof (typeof resources)['fr'];

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en'];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
