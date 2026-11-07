import { afterEach, describe, expect, it } from '@jest/globals';
import { i18n } from './index';
import { appLocale } from './locale';

describe('appLocale', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('follows the language chosen in the app', async () => {
    await i18n.changeLanguage('fr');
    expect(appLocale()).toBe('fr-FR');
    await i18n.changeLanguage('en');
    expect(appLocale()).toBe('en-GB');
  });
});
