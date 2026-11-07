import { i18n } from '@/i18n';
import type { SchoolService } from '@/features/school/services/school.service';
import type { PickupValidation, QrScanResult } from '@/features/school/types';
import type { HistoryEntry } from '@/features/parent/services/history.service';
import type { PickupLog } from '@/features/parent/types';
import { evaluateDemoScan, type DemoScanOutcome } from '../domain/engine';
import { parseDemoQrPayload } from '../domain/qrScenarios';
import { DEMO_UNAUTHORIZED_PERSON } from '../domain/seed';
import type { DemoWorld } from '../domain/types';
import { DEMO_USER_IDS } from '../session';
import { demoId, demoUnavailable, readWorld, writeWorld } from './world';

const text = (key: string) => i18n.t(`demo:${key}`);

function personFor(
  world: DemoWorld,
  payload: string,
  outcome: DemoScanOutcome
) {
  const parsed = parseDemoQrPayload(payload);
  if (
    parsed?.kind === 'scenario' &&
    parsed.scenario === 'unauthorized-person'
  ) {
    return { ...DEMO_UNAUTHORIZED_PERSON };
  }
  const guardian = world.guardians.find(g => g.id === outcome.guardianId);
  return guardian
    ? {
        id: guardian.id,
        first_name: guardian.first_name,
        last_name: guardian.last_name,
        phone: guardian.phone ?? '',
        photo_url: null,
        relationship: guardian.relationship,
        identity_status: guardian.identity_status,
      }
    : null;
}

function usedLiveCode(world: DemoWorld, payload: string): boolean {
  if (parseDemoQrPayload(payload)?.kind !== 'live') return false;
  const latest = world.qrCodes.find(code => code.token === payload);
  return !!latest?.is_used;
}

function record(
  world: DemoWorld,
  payload: string,
  outcome: DemoScanOutcome,
  result: QrScanResult,
  scannedAt: string
): DemoWorld {
  const child = world.children.find(c => c.id === outcome.childId);
  if (!child) return world;
  const validated = outcome.status === 'validated';
  const id = demoId('scan');
  const guardian = result.guardian ?? null;

  const validation: PickupValidation = {
    id: `validation-${id}`,
    school_id: world.school.id,
    child_id: child.id,
    guardian_id: outcome.guardianId,
    qr_code_id: null,
    scanner_user_id: DEMO_USER_IDS.establishment,
    status: validated ? 'validated' : 'refused',
    refusal_reason: result.refusal_reason ?? null,
    scanned_at: scannedAt,
    meta: null,
    created_at: scannedAt,
    child: {
      id: child.id,
      first_name: child.first_name,
      last_name: child.last_name,
      photo_url: null,
      class_name: child.class_name,
      parent: child.parent
        ? {
            first_name: child.parent.first_name,
            last_name: child.parent.last_name,
          }
        : null,
    },
    guardian,
  };

  const shared = {
    child: {
      first_name: child.first_name,
      last_name: child.last_name,
      photo_url: null,
    },
    guardian: guardian
      ? {
          first_name: guardian.first_name,
          last_name: guardian.last_name,
          relationship: guardian.relationship,
        }
      : null,
  };

  const historyEntry: HistoryEntry = {
    id: `history-${id}`,
    child_id: child.id,
    collector_id: outcome.guardianId,
    parent_id: child.parent_id,
    school_id: world.school.id,
    staff_id: DEMO_USER_IDS.establishment,
    qr_jti: null,
    status: validated ? 'completed' : 'denied',
    scanned_at: scannedAt,
    pickup_time: validated ? scannedAt : null,
    created_at: scannedAt,
    denial_reason: result.refusal_reason ?? null,
    is_pinned: false,
    is_archived: false,
    archived_at: null,
    child: shared.child,
    guardian: shared.guardian ? { ...shared.guardian, photo_url: null } : null,
  };

  const log: PickupLog = {
    id: `log-${id}`,
    child_id: child.id,
    guardian_id: outcome.guardianId,
    qr_code_id: null,
    staff_id: DEMO_USER_IDS.establishment,
    pickup_time: scannedAt,
    status: validated ? 'completed' : 'denied',
    denial_reason: result.refusal_reason ?? null,
    notes: null,
    created_at: scannedAt,
    child: shared.child,
    guardian: shared.guardian ?? undefined,
  };

  return {
    ...world,
    validations: [validation, ...world.validations],
    history: [historyEntry, ...world.history],
    pickupLogs: [log, ...world.pickupLogs],
    qrCodes:
      validated && parseDemoQrPayload(payload)?.kind === 'live'
        ? world.qrCodes.map(code =>
            code.token === payload
              ? { ...code, is_used: true, used_at: scannedAt }
              : code
          )
        : world.qrCodes,
  };
}

function startOfToday(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export const demoSchoolService: SchoolService = {
  async getSchoolByAdminUserId() {
    return readWorld().school;
  },

  async getSchoolById() {
    return readWorld().school;
  },

  async updateSchool(_schoolId, payload) {
    writeWorld(world => ({
      ...world,
      school: { ...world.school, ...payload },
    }));
    return readWorld().school;
  },

  async updateSchoolLogo() {
    throw demoUnavailable();
  },

  async getEnrolledChildren() {
    return [...readWorld().children].sort((a, b) =>
      a.last_name.localeCompare(b.last_name)
    );
  },

  async getPickupValidations() {
    return readWorld().validations;
  },

  async getTodayValidations() {
    const since = startOfToday();
    return readWorld().validations.filter(v => v.scanned_at >= since);
  },

  async getDashboardStats() {
    const world = readWorld();
    const since = startOfToday();
    const today = world.validations.filter(v => v.scanned_at >= since);
    return {
      todayValidations: today.filter(v => v.status === 'validated').length,
      todayRefusals: today.filter(v => v.status === 'refused').length,
      enrolledCount: world.children.length,
      recentValidations: world.validations.slice(0, 10),
    };
  },

  async validateQr(qrToken) {
    const world = readWorld();
    const now = new Date();
    const scannedAt = now.toISOString();

    const outcome: DemoScanOutcome = usedLiveCode(world, qrToken)
      ? {
          status: 'refused',
          childId:
            parseDemoQrPayload(qrToken)?.kind === 'live'
              ? (world.qrCodes.find(code => code.token === qrToken)?.child_id ??
                null)
              : null,
          guardianId:
            world.qrCodes.find(code => code.token === qrToken)?.guardian_id ??
            null,
          reasonKey: 'qr_refused_used',
        }
      : evaluateDemoScan(world, qrToken, now);

    const child = world.children.find(c => c.id === outcome.childId);
    const result: QrScanResult = {
      success: outcome.status === 'validated',
      scanned_at: scannedAt,
      ...(outcome.status === 'validated'
        ? { note: text(outcome.noteKey) }
        : { refusal_reason: text(outcome.reasonKey) }),
      child: child
        ? {
            id: child.id,
            first_name: child.first_name,
            last_name: child.last_name,
            photo_url: null,
            class_name: child.class_name,
          }
        : undefined,
      guardian: personFor(world, qrToken, outcome),
    };

    writeWorld(current => record(current, qrToken, outcome, result, scannedAt));
    return result;
  },
};
