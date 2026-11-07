import type { Locale } from 'date-fns';
import { enGB, fr } from 'date-fns/locale';
import { i18n } from './index';

const LOCALES = { fr: 'fr-FR', en: 'en-GB' } as const;

export function appLocale(): string {
  return i18n.language === 'en' ? LOCALES.en : LOCALES.fr;
}

export function dateFnsLocale(): Locale {
  return i18n.language === 'en' ? enGB : fr;
}
