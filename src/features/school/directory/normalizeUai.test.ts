import { describe, expect, it } from '@jest/globals';
import { isValidUaiFormat, normalizeUai } from './normalizeUai';

describe('normalizeUai', () => {
  it('normalizes case and accidental spaces', () => {
    expect(normalizeUai(' 0923504j ')).toBe('0923504J');
    expect(normalizeUai('092 3504 j')).toBe('0923504J');
  });

  it.each(['0923504J', '1234567A'])('accepts %s', value => {
    expect(isValidUaiFormat(value)).toBe(true);
  });

  it.each(['', '923504J', '09235045', '0923504JJ', 'ABCDEFGH'])(
    'rejects %s',
    value => {
      expect(isValidUaiFormat(value)).toBe(false);
    }
  );
});
