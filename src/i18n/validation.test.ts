import { afterEach, describe, expect, it } from '@jest/globals';
import { loginSchema } from '@/features/auth/schemas/auth.schema';
import { i18n } from './index';

function firstMessage(input: unknown): string | undefined {
  const result = loginSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('form validation messages', () => {
  afterEach(async () => {
    await i18n.changeLanguage('fr');
  });

  it('speaks the language chosen when the form is validated', async () => {
    await i18n.changeLanguage('fr');
    expect(firstMessage({ email: 'nope', password: 'longenough' })).toBe(
      i18n.t('errors:email_invalid')
    );
    await i18n.changeLanguage('en');
    expect(firstMessage({ email: 'nope', password: 'longenough' })).toBe(
      'Invalid email address.'
    );
  });
});
