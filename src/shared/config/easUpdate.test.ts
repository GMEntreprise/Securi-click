import { describe, expect, it } from '@jest/globals';
import easJson from '../../../eas.json';
import appConfig from '../../../app.config';

const config = appConfig as unknown as {
  extra: { eas: { projectId: string } };
  updates: Record<string, unknown>;
  runtimeVersion: { policy: string };
};

const buildProfiles = (
  easJson as unknown as {
    build: Record<string, { channel?: string; distribution?: string }>;
  }
).build;

describe('EAS Update configuration', () => {
  it('points updates at this project and nowhere else', () => {
    expect(config.updates.enabled).toBe(true);
    expect(config.updates.url).toBe(
      `https://u.expo.dev/${config.extra.eas.projectId}`
    );
  });

  it('derives the runtime from the native fingerprint', () => {
    expect(config.runtimeVersion).toEqual({ policy: 'fingerprint' });
  });

  it('never makes someone wait at launch for an update', () => {
    expect(config.updates.fallbackToCacheTimeout).toBe(0);
    expect(config.updates.useEmbeddedUpdate).toBe(true);
  });

  it('gives every build profile a channel', () => {
    const withoutChannel = Object.entries(buildProfiles)
      .filter(([, profile]) => !profile.channel)
      .map(([name]) => name);
    expect(withoutChannel).toEqual([]);
  });

  it('keeps the store build on the production channel and nothing else there', () => {
    expect(buildProfiles.production.channel).toBe('production');
    const onProduction = Object.entries(buildProfiles)
      .filter(([, profile]) => profile.channel === 'production')
      .map(([name]) => name);
    expect(onProduction).toEqual(['production']);
  });

  it('keeps internal builds away from the production channel', () => {
    for (const [name, profile] of Object.entries(buildProfiles)) {
      if (profile.distribution !== 'internal') continue;
      expect(`${name} -> ${profile.channel}`).not.toContain('-> production');
    }
  });
});
