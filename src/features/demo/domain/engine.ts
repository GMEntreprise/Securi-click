import { i18n } from '@/i18n';
import type { CollectorIdentityStatus } from '@/features/school/types';
import { DEMO_IDS, demoUnauthorizedPerson } from './seed';
import {
  parseDemoQrPayload,
  type DemoLiveCode,
  type DemoQrScenarioId,
} from './qrScenarios';
import type { DemoGuardian, DemoWorld } from './types';

export const DEMO_QR_VALIDITY_MS = 24 * 60 * 60 * 1000;

export interface DemoScanChild {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string | null;
}

export interface DemoScanGuardian {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  relationship: string;
  identity_status: CollectorIdentityStatus;
}

export type DemoScanOutcome =
  | {
      status: 'validated';
      child: DemoScanChild;
      guardian: DemoScanGuardian | null;
      noteKey: string;
    }
  | {
      status: 'refused';
      child: DemoScanChild | null;
      guardian: DemoScanGuardian | null;
      reasonKey: string;
    };

const SCENARIO_ROWS: Record<
  Exclude<
    DemoQrScenarioId,
    | 'unauthorized-person'
    | 'expired-code'
    | 'parent-ines'
    | 'parent-lea'
    | 'wrong-child'
    | 'already-used'
  >,
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
  'revoked-access': {
    childId: DEMO_IDS.lucas,
    guardianId: DEMO_IDS.sophieLucas,
    noteKey: 'qr_note_authorized',
  },
};

const UNKNOWN: DemoScanOutcome = {
  status: 'refused',
  child: null,
  guardian: null,
  reasonKey: 'qr_refused_unknown',
};

function childOf(world: DemoWorld, childId: string): DemoScanChild | null {
  const child = world.children.find(row => row.id === childId);
  return child
    ? {
        id: child.id,
        first_name: child.first_name,
        last_name: child.last_name,
        class_name: child.class_name,
      }
    : null;
}

function guardianOf(guardian: DemoGuardian): DemoScanGuardian {
  return {
    id: guardian.id,
    first_name: guardian.first_name,
    last_name: guardian.last_name,
    phone: guardian.phone ?? '',
    relationship: guardian.relationship,
    identity_status: guardian.identity_status,
  };
}

function evaluateGuardian(
  world: DemoWorld,
  child: DemoScanChild,
  guardianId: string,
  noteKey: string,
  now: Date
): DemoScanOutcome {
  const row = world.guardians.find(g => g.id === guardianId);

  if (!row || row.child_id !== child.id) {
    return {
      status: 'refused',
      child,
      guardian: null,
      reasonKey: 'qr_refused_unauthorized',
    };
  }

  const guardian = guardianOf(row);
  if (!row.is_active) {
    return {
      status: 'refused',
      child,
      guardian,
      reasonKey: 'qr_refused_revoked',
    };
  }

  const authorization = world.authorizations.find(
    a => a.guardian_id === guardianId && a.child_id === child.id
  );
  if (
    authorization?.expires_at &&
    new Date(authorization.expires_at).getTime() < now.getTime()
  ) {
    return {
      status: 'refused',
      child,
      guardian,
      reasonKey: 'qr_refused_authorization_expired',
    };
  }

  return { status: 'validated', child, guardian, noteKey };
}

function evaluateLive(
  world: DemoWorld,
  payload: string,
  code: DemoLiveCode,
  now: Date
): DemoScanOutcome {
  const child = childOf(world, code.childId) ?? {
    id: code.childId,
    ...code.child,
  };
  const known = world.guardians.find(g => g.id === code.guardianId);
  const guardian: DemoScanGuardian | null = known
    ? guardianOf(known)
    : code.guardianId && code.guardian
      ? {
          id: code.guardianId,
          phone: '',
          identity_status: 'none',
          ...code.guardian,
        }
      : null;

  if (world.usedQrTokens.includes(payload)) {
    return { status: 'refused', child, guardian, reasonKey: 'qr_refused_used' };
  }
  if (code.expiresAt <= now.getTime()) {
    return {
      status: 'refused',
      child,
      guardian,
      reasonKey: 'qr_refused_expired',
    };
  }
  if (code.guardianId === null) {
    return { status: 'validated', child, guardian, noteKey: 'qr_note_parent' };
  }
  if (!known) {
    return {
      status: 'validated',
      child,
      guardian,
      noteKey: 'qr_note_authorized',
    };
  }
  return evaluateGuardian(
    world,
    child,
    code.guardianId,
    'qr_note_authorized',
    now
  );
}

export function demoLiveCodeFor(
  world: DemoWorld,
  childId: string,
  guardianId: string | null,
  issuedAt: Date,
  nonce: string
): DemoLiveCode | null {
  const child = childOf(world, childId);
  if (!child) return null;
  const guardian = world.guardians.find(g => g.id === guardianId);
  return {
    childId,
    guardianId,
    expiresAt: issuedAt.getTime() + DEMO_QR_VALIDITY_MS,
    nonce,
    child: {
      first_name: child.first_name,
      last_name: child.last_name,
      class_name: child.class_name,
    },
    guardian: guardian
      ? {
          first_name: guardian.first_name,
          last_name: guardian.last_name,
          relationship: guardian.relationship,
        }
      : null,
  };
}

function parentPickup(world: DemoWorld, childId: string): DemoScanOutcome {
  const row = world.children.find(child => child.id === childId);
  const child = childOf(world, childId);
  if (!row?.parent || !child) return UNKNOWN;
  return {
    status: 'validated',
    child,
    guardian: {
      id: `${childId}-parent`,
      first_name: row.parent.first_name,
      last_name: row.parent.last_name,
      phone: row.parent.phone ?? '',
      relationship: i18n.t('demo:seed_rel_parent'),
      identity_status: 'none',
    },
    noteKey: 'qr_note_parent',
  };
}

function refusedWith(
  world: DemoWorld,
  childId: string,
  guardianId: string,
  reasonKey: string
): DemoScanOutcome {
  const child = childOf(world, childId);
  const guardian = world.guardians.find(g => g.id === guardianId);
  return child
    ? {
        status: 'refused',
        child,
        guardian: guardian ? guardianOf(guardian) : null,
        reasonKey,
      }
    : UNKNOWN;
}

export function evaluateDemoScan(
  world: DemoWorld,
  payload: string,
  now: Date
): DemoScanOutcome {
  const parsed = parseDemoQrPayload(payload);
  if (!parsed) return UNKNOWN;

  if (parsed.kind === 'live') return evaluateLive(world, payload, parsed, now);

  switch (parsed.scenario) {
    case 'unauthorized-person': {
      const child = childOf(world, DEMO_IDS.lucas);
      return child
        ? {
            status: 'refused',
            child,
            guardian: demoUnauthorizedPerson(),
            reasonKey: 'qr_refused_unauthorized',
          }
        : UNKNOWN;
    }
    case 'expired-code': {
      const child = childOf(world, DEMO_IDS.emma);
      const sophie = world.guardians.find(g => g.id === DEMO_IDS.sophieEmma);
      return child
        ? {
            status: 'refused',
            child,
            guardian: sophie ? guardianOf(sophie) : null,
            reasonKey: 'qr_refused_expired',
          }
        : UNKNOWN;
    }
    case 'parent-ines':
      return parentPickup(world, DEMO_IDS.ines);
    case 'parent-lea':
      return parentPickup(world, DEMO_IDS.lea);
    case 'wrong-child':
      return refusedWith(
        world,
        DEMO_IDS.noe,
        DEMO_IDS.thomasLucas,
        'qr_refused_unauthorized'
      );
    case 'already-used':
      return refusedWith(
        world,
        DEMO_IDS.emma,
        DEMO_IDS.julieEmma,
        'qr_refused_used'
      );
    default: {
      const row = SCENARIO_ROWS[parsed.scenario];
      const child = childOf(world, row.childId);
      return child
        ? evaluateGuardian(world, child, row.guardianId, row.noteKey, now)
        : UNKNOWN;
    }
  }
}
