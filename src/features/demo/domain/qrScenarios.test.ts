import { describe, expect, it } from '@jest/globals';
import {
  DEMO_QR_SCENARIOS,
  buildDemoLiveToken,
  isDemoQrPayload,
  parseDemoQrPayload,
} from './qrScenarios';

describe('demo QR payloads', () => {
  it('defines five distinct printed scenarios', () => {
    const payloads = DEMO_QR_SCENARIOS.map(scenario => scenario.payload);
    expect(new Set(payloads).size).toBe(5);
    expect(
      DEMO_QR_SCENARIOS.filter(s => s.expected === 'validated')
    ).toHaveLength(3);
    expect(
      DEMO_QR_SCENARIOS.filter(s => s.expected === 'refused')
    ).toHaveLength(2);
  });

  it('never resembles a real pickup token', () => {
    for (const { payload } of DEMO_QR_SCENARIOS) {
      expect(payload.startsWith('SC-')).toBe(false);
      expect(isDemoQrPayload(payload)).toBe(true);
    }
  });

  it('recognises only well-formed demo payloads', () => {
    expect(parseDemoQrPayload(DEMO_QR_SCENARIOS[0].payload)).toEqual({
      kind: 'scenario',
      scenario: DEMO_QR_SCENARIOS[0].id,
    });
    expect(parseDemoQrPayload('SC-TESTTOKEN0001')).toBeNull();
    expect(parseDemoQrPayload('SECURICLICK-DEMO:v1:unknown')).toBeNull();
    expect(
      parseDemoQrPayload('SECURICLICK-DEMO:v2:authorized-grandmother')
    ).toBeNull();
    expect(parseDemoQrPayload('')).toBeNull();
  });

  it('round-trips a code generated inside the demo', () => {
    const token = buildDemoLiveToken(
      'demo-child-emma',
      'demo-guardian-sophie-emma'
    );
    expect(isDemoQrPayload(token)).toBe(true);
    expect(parseDemoQrPayload(token)).toEqual({
      kind: 'live',
      childId: 'demo-child-emma',
      guardianId: 'demo-guardian-sophie-emma',
    });
    expect(
      parseDemoQrPayload(buildDemoLiveToken('demo-child-emma', null))
    ).toEqual({
      kind: 'live',
      childId: 'demo-child-emma',
      guardianId: null,
    });
  });
});
