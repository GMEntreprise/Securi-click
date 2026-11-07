import { i18n } from './index';

const LOCALES = { fr: 'fr-FR', en: 'en-GB' } as const;

export function appLocale(): string {
  return i18n.language === 'en' ? LOCALES.en : LOCALES.fr;
}
