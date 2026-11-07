export type DemoQrScenarioId =
  | 'authorized-grandmother'
  | 'authorized-father'
  | 'temporary-nanny'
  | 'unauthorized-person'
  | 'expired-code';

export interface DemoQrScenario {
  id: DemoQrScenarioId;
  number: string;
  payload: string;
  expected: 'validated' | 'refused';
  labelKey: string;
}

const PREFIX = 'SECURICLICK-DEMO';
const VERSION = 'v1';
const ROOT = `${PREFIX}:${VERSION}`;
const NO_GUARDIAN = 'parent';

export const DEMO_QR_SCENARIOS: readonly DemoQrScenario[] = [
  {
    id: 'authorized-grandmother',
    number: '01',
    payload: `${ROOT}:authorized-grandmother`,
    expected: 'validated',
    labelKey: 'qr_label_authorized_grandmother',
  },
  {
    id: 'authorized-father',
    number: '02',
    payload: `${ROOT}:authorized-father`,
    expected: 'validated',
    labelKey: 'qr_label_authorized_father',
  },
  {
    id: 'temporary-nanny',
    number: '03',
    payload: `${ROOT}:temporary-nanny`,
    expected: 'validated',
    labelKey: 'qr_label_temporary_nanny',
  },
  {
    id: 'unauthorized-person',
    number: '04',
    payload: `${ROOT}:unauthorized-person`,
    expected: 'refused',
    labelKey: 'qr_label_unauthorized_person',
  },
  {
    id: 'expired-code',
    number: '05',
    payload: `${ROOT}:expired-code`,
    expected: 'refused',
    labelKey: 'qr_label_expired_code',
  },
];

export type ParsedDemoQr =
  | { kind: 'scenario'; scenario: DemoQrScenarioId }
  | { kind: 'live'; childId: string; guardianId: string | null };

export function isDemoQrPayload(payload: string): boolean {
  return payload.startsWith(`${PREFIX}:`);
}

export function buildDemoLiveToken(
  childId: string,
  guardianId: string | null
): string {
  return `${ROOT}:live:${childId}:${guardianId ?? NO_GUARDIAN}`;
}

export function parseDemoQrPayload(payload: string): ParsedDemoQr | null {
  const parts = payload.split(':');
  if (parts[0] !== PREFIX || parts[1] !== VERSION) return null;

  if (parts[2] === 'live' && parts.length === 5 && parts[3] && parts[4]) {
    return {
      kind: 'live',
      childId: parts[3],
      guardianId: parts[4] === NO_GUARDIAN ? null : parts[4],
    };
  }

  const scenario = DEMO_QR_SCENARIOS.find(item => item.payload === payload);
  return scenario ? { kind: 'scenario', scenario: scenario.id } : null;
}
