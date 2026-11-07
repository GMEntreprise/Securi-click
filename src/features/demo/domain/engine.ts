import { DEMO_IDS } from './seed';
import { parseDemoQrPayload, type DemoQrScenarioId } from './qrScenarios';
import type { DemoWorld } from './types';

export type DemoScanOutcome =
  | {
      status: 'validated';
      childId: string;
      guardianId: string | null;
      noteKey: string;
    }
  | {
      status: 'refused';
      childId: string | null;
      guardianId: string | null;
      reasonKey: string;
    };

const SCENARIO_ROWS: Record<
  Exclude<DemoQrScenarioId, 'unauthorized-person' | 'expired-code'>,
  { childId: string; guardianId: string; noteKey: string }
> = {
  'authorized-grandmother': {
    childId: DEMO_IDS.emma,
    guardianId: DEMO_IDS.sophieEmma,
    noteKey: 'qr_note_authorized',
  },
  'authorized-father': {
    childId: DEMO_IDS.lucas,
    guardianId: DEMO_IDS.thomasLucas,
    noteKey: 'qr_note_child_specific',
  },
  'temporary-nanny': {
    childId: DEMO_IDS.emma,
    guardianId: DEMO_IDS.julieEmma,
    noteKey: 'qr_note_temporary',
  },
};

const UNKNOWN: DemoScanOutcome = {
  status: 'refused',
  childId: null,
  guardianId: null,
  reasonKey: 'qr_refused_unknown',
};

function evaluateGuardian(
  world: DemoWorld,
  childId: string,
  guardianId: string,
  noteKey: string,
  now: Date
): DemoScanOutcome {
  const guardian = world.guardians.find(row => row.id === guardianId);

  if (!guardian || guardian.child_id !== childId) {
    return {
      status: 'refused',
      childId,
      guardianId: null,
      reasonKey: 'qr_refused_unauthorized',
    };
  }
  if (!guardian.is_active) {
    return {
      status: 'refused',
      childId,
      guardianId,
      reasonKey: 'qr_refused_revoked',
    };
  }

  const authorization = world.authorizations.find(
    row => row.guardian_id === guardianId && row.child_id === childId
  );
  if (
    authorization?.expires_at &&
    new Date(authorization.expires_at).getTime() < now.getTime()
  ) {
    return {
      status: 'refused',
      childId,
      guardianId,
      reasonKey: 'qr_refused_authorization_expired',
    };
  }

  return { status: 'validated', childId, guardianId, noteKey };
}

export function evaluateDemoScan(
  world: DemoWorld,
  payload: string,
  now: Date
): DemoScanOutcome {
  const parsed = parseDemoQrPayload(payload);
  if (!parsed) return UNKNOWN;

  if (parsed.kind === 'live') {
    if (!world.children.some(child => child.id === parsed.childId)) {
      return UNKNOWN;
    }
    if (parsed.guardianId === null) {
      return {
        status: 'validated',
        childId: parsed.childId,
        guardianId: null,
        noteKey: 'qr_note_parent',
      };
    }
    return evaluateGuardian(
      world,
      parsed.childId,
      parsed.guardianId,
      'qr_note_authorized',
      now
    );
  }

  switch (parsed.scenario) {
    case 'unauthorized-person':
      return {
        status: 'refused',
        childId: DEMO_IDS.lucas,
        guardianId: null,
        reasonKey: 'qr_refused_unauthorized',
      };
    case 'expired-code':
      return {
        status: 'refused',
        childId: DEMO_IDS.emma,
        guardianId: DEMO_IDS.sophieEmma,
        reasonKey: 'qr_refused_expired',
      };
    default: {
      const row = SCENARIO_ROWS[parsed.scenario];
      return evaluateGuardian(
        world,
        row.childId,
        row.guardianId,
        row.noteKey,
        now
      );
    }
  }
}
