import { describe, expect, it } from '@jest/globals';
import {
  DEMO_QR_SCENARIOS,
  buildDemoLiveToken,
  isDemoQrPayload,
  parseDemoQrPayload,
} from './qrScenarios';

describe('demo QR payloads', () => {
  it('defines ten distinct printed scenarios, half validated', () => {
    const payloads = DEMO_QR_SCENARIOS.map(scenario => scenario.payload);
    expect(new Set(payloads).size).toBe(10);
    expect(DEMO_QR_SCENARIOS.map(scenario => scenario.number)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
    ]);
    expect(
      DEMO_QR_SCENARIOS.filter(s => s.expected === 'validated')
    ).toHaveLength(5);
    expect(
      DEMO_QR_SCENARIOS.filter(s => s.expected === 'refused')
    ).toHaveLength(5);
  });

  it('opens the download section of the website when scanned by a camera', () => {
    for (const { id, payload } of DEMO_QR_SCENARIOS) {
      expect(payload).toBe(`https://securi-click.com/?demo=${id}#telecharger`);
      expect(payload.startsWith('SC-')).toBe(false);
      expect(isDemoQrPayload(payload)).toBe(true);
    }
  });

  it('recognises only well-formed demo payloads', () => {
    expect(parseDemoQrPayload(DEMO_QR_SCENARIOS[0].payload)).toEqual({
      kind: 'scenario',
      scenario: DEMO_QR_SCENARIOS[0].id,
    });
    expect(
      parseDemoQrPayload('SECURICLICK-DEMO:v1:authorized-grandmother')
    ).toEqual({ kind: 'scenario', scenario: 'authorized-grandmother' });
    expect(parseDemoQrPayload('SC-TESTTOKEN0001')).toBeNull();
    expect(parseDemoQrPayload('SECURICLICK-DEMO:v1:unknown')).toBeNull();
    expect(
      parseDemoQrPayload('SECURICLICK-DEMO:v2:authorized-grandmother')
    ).toBeNull();
    expect(
      parseDemoQrPayload('https://securi-click.com/?demo=unknown#telecharger')
    ).toBeNull();
    expect(
      parseDemoQrPayload('https://evil.example/?demo=authorized-grandmother')
    ).toBeNull();
    expect(isDemoQrPayload('https://securi-click.com/#telecharger')).toBe(
      false
    );
    expect(parseDemoQrPayload('')).toBeNull();
  });

  it('round-trips a self-contained code generated on another device', () => {
    const code = {
      childId: 'demo-child-emma',
      guardianId: 'demo-guardian-nina',
      expiresAt: Date.UTC(2026, 10, 8, 16, 30),
      nonce: 'k3x9',
      child: { first_name: 'Emma', last_name: 'Martin', class_name: 'CP' },
      guardian: {
        first_name: 'Nina',
        last_name: "Roux-d'Arc: tante",
        relationship: 'Tante',
      },
    };
    const token = buildDemoLiveToken(code);
    expect(isDemoQrPayload(token)).toBe(true);
    expect(parseDemoQrPayload(token)).toEqual({ kind: 'live', ...code });
    const parentCode = { ...code, guardianId: null, guardian: null };
    expect(parseDemoQrPayload(buildDemoLiveToken(parentCode))).toEqual({
      kind: 'live',
      ...parentCode,
    });
  });

  it('refuses a live code that points outside the demo', () => {
    const token = buildDemoLiveToken({
      childId: '6f1c2b0e-0000-4000-8000-000000000001',
      guardianId: null,
      expiresAt: Date.UTC(2026, 10, 8),
      nonce: 'a',
      child: { first_name: 'X', last_name: 'Y', class_name: null },
      guardian: null,
    });
    expect(parseDemoQrPayload(token)).toBeNull();
    expect(
      parseDemoQrPayload('SECURICLICK-DEMO:v1:live:demo-child-emma:parent')
    ).toBeNull();
    expect(
      parseDemoQrPayload(
        'SECURICLICK-DEMO:v1:live:demo-child-emma:parent:zz:n:%E0%A4%A:M::::'
      )
    ).toBeNull();
  });
});
