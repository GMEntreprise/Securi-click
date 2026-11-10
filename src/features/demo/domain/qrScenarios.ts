export type DemoQrScenarioId =
  | 'authorized-grandmother'
  | 'authorized-father'
  | 'temporary-nanny'
  | 'unauthorized-person'
  | 'expired-code'
  | 'parent-ines'
  | 'parent-lea'
  | 'revoked-access'
  | 'wrong-child'
  | 'already-used';

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

export const DEMO_QR_SITE = 'https://securi-click.com/';
const DOWNLOAD_ANCHOR = '#telecharger';
const SCENARIO_PARAM =
  /^https:\/\/securi-click\.com\/?\?demo=([a-z-]+)(#[a-z-]*)?$/;

export function demoScenarioUrl(id: DemoQrScenarioId): string {
  return `${DEMO_QR_SITE}?demo=${id}${DOWNLOAD_ANCHOR}`;
}

export const DEMO_QR_SCENARIOS: readonly DemoQrScenario[] = [
  {
    id: 'authorized-grandmother',
    number: '01',
    payload: demoScenarioUrl('authorized-grandmother'),
    expected: 'validated',
    labelKey: 'qr_label_authorized_grandmother',
  },
  {
    id: 'authorized-father',
    number: '02',
    payload: demoScenarioUrl('authorized-father'),
    expected: 'validated',
    labelKey: 'qr_label_authorized_father',
  },
  {
    id: 'temporary-nanny',
    number: '03',
    payload: demoScenarioUrl('temporary-nanny'),
    expected: 'validated',
    labelKey: 'qr_label_temporary_nanny',
  },
  {
    id: 'unauthorized-person',
    number: '04',
    payload: demoScenarioUrl('unauthorized-person'),
    expected: 'refused',
    labelKey: 'qr_label_unauthorized_person',
  },
  {
    id: 'expired-code',
    number: '05',
    payload: demoScenarioUrl('expired-code'),
    expected: 'refused',
    labelKey: 'qr_label_expired_code',
  },
  {
    id: 'parent-ines',
    number: '06',
    payload: demoScenarioUrl('parent-ines'),
    expected: 'validated',
    labelKey: 'qr_label_parent_ines',
  },
  {
    id: 'parent-lea',
    number: '07',
    payload: demoScenarioUrl('parent-lea'),
    expected: 'validated',
    labelKey: 'qr_label_parent_lea',
  },
  {
    id: 'revoked-access',
    number: '08',
    payload: demoScenarioUrl('revoked-access'),
    expected: 'refused',
    labelKey: 'qr_label_revoked_access',
  },
  {
    id: 'wrong-child',
    number: '09',
    payload: demoScenarioUrl('wrong-child'),
    expected: 'refused',
    labelKey: 'qr_label_wrong_child',
  },
  {
    id: 'already-used',
    number: '10',
    payload: demoScenarioUrl('already-used'),
    expected: 'refused',
    labelKey: 'qr_label_already_used',
  },
];

export interface DemoLiveCode {
  childId: string;
  guardianId: string | null;
  expiresAt: number;
  nonce: string;
  child: { first_name: string; last_name: string; class_name: string | null };
  guardian: {
    first_name: string;
    last_name: string;
    relationship: string;
  } | null;
}

export type ParsedDemoQr =
  | { kind: 'scenario'; scenario: DemoQrScenarioId }
  | ({ kind: 'live' } & DemoLiveCode);

const LIVE = 'live';
const LIVE_FIELDS = 10;
const DEMO_ID_PREFIX = 'demo-';

function scenarioFromUrl(payload: string): DemoQrScenarioId | null {
  const id = SCENARIO_PARAM.exec(payload)?.[1];
  return DEMO_QR_SCENARIOS.find(item => item.id === id)?.id ?? null;
}

export function isDemoQrPayload(payload: string): boolean {
  return payload.startsWith(`${PREFIX}:`) || scenarioFromUrl(payload) !== null;
}

export function buildDemoLiveToken(code: DemoLiveCode): string {
  const fields = [
    code.childId,
    code.guardianId ?? NO_GUARDIAN,
    code.expiresAt.toString(36),
    code.nonce,
    code.child.first_name,
    code.child.last_name,
    code.child.class_name ?? '',
    code.guardian?.first_name ?? '',
    code.guardian?.last_name ?? '',
    code.guardian?.relationship ?? '',
  ];
  return [ROOT, LIVE, ...fields.map(encodeURIComponent)].join(':');
}

function decodeFields(raw: string[]): string[] | null {
  try {
    return raw.map(decodeURIComponent);
  } catch {
    return null;
  }
}

function parseLive(raw: string[]): DemoLiveCode | null {
  if (raw.length !== LIVE_FIELDS) return null;
  const fields = decodeFields(raw);
  if (!fields) return null;
  const [
    childId,
    guardian,
    expires,
    nonce,
    childFirst,
    childLast,
    className,
    guardianFirst,
    guardianLast,
    relationship,
  ] = fields;
  const expiresAt = parseInt(expires, 36);
  const guardianId = guardian === NO_GUARDIAN ? null : guardian;

  if (!childId.startsWith(DEMO_ID_PREFIX)) return null;
  if (guardianId !== null && !guardianId.startsWith(DEMO_ID_PREFIX)) {
    return null;
  }
  if (!Number.isFinite(expiresAt) || !nonce || !childFirst) return null;
  if (guardianId !== null && !guardianFirst) return null;

  return {
    childId,
    guardianId,
    expiresAt,
    nonce,
    child: {
      first_name: childFirst,
      last_name: childLast,
      class_name: className || null,
    },
    guardian:
      guardianId === null
        ? null
        : {
            first_name: guardianFirst,
            last_name: guardianLast,
            relationship,
          },
  };
}

export function parseDemoQrPayload(payload: string): ParsedDemoQr | null {
  const fromUrl = scenarioFromUrl(payload);
  if (fromUrl) return { kind: 'scenario', scenario: fromUrl };

  const parts = payload.split(':');
  if (parts[0] !== PREFIX || parts[1] !== VERSION) return null;

  if (parts[2] === LIVE) {
    const live = parseLive(parts.slice(3));
    return live ? { kind: 'live', ...live } : null;
  }

  const scenario = DEMO_QR_SCENARIOS.find(
    item => `${ROOT}:${item.id}` === payload
  );
  return scenario ? { kind: 'scenario', scenario: scenario.id } : null;
}
