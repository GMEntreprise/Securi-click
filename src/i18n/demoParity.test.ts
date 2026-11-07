import { describe, expect, it } from '@jest/globals';
import { resources } from './resources';

const flatten = (node: object, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [`${prefix}${key}`]
  );

describe('demo translations', () => {
  it('has the same keys in French and English, none empty', () => {
    expect(flatten(resources.en.demo).sort()).toEqual(
      flatten(resources.fr.demo).sort()
    );
    for (const locale of [resources.fr.demo, resources.en.demo]) {
      for (const value of Object.values(locale))
        expect(String(value).length).toBeGreaterThan(0);
    }
  });
});
