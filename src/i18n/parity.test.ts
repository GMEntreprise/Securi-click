import { describe, expect, it } from '@jest/globals';
import { resources } from './resources';

const flatten = (node: object, prefix = ''): [string, unknown][] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value] as [string, unknown]]
  );

const NAMESPACES = Object.keys(resources.fr) as (keyof typeof resources.fr)[];

describe('translations', () => {
  it.each(NAMESPACES)(
    '%s has the same keys in French and English, none empty',
    namespace => {
      const fr = flatten(resources.fr[namespace]);
      const en = flatten(resources.en[namespace]);
      expect(en.map(([key]) => key).sort()).toEqual(
        fr.map(([key]) => key).sort()
      );
      for (const [, value] of [...fr, ...en]) {
        expect(String(value).trim().length).toBeGreaterThan(0);
      }
    }
  );
});
