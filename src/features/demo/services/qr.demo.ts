import type {
  QrCode,
  QrService,
  RecentScan,
} from '@/features/parent/services/qr.service';
import { demoLiveCodeFor } from '../domain/engine';
import { buildDemoLiveToken } from '../domain/qrScenarios';
import type { DemoWorld } from '../domain/types';
import { DEMO_USER_IDS } from '../session';
import { demoId, demoUnavailable, readWorld, writeWorld } from './world';

function isUsable(code: QrCode, now: number): boolean {
  return !code.is_used && new Date(code.expires_at).getTime() > now;
}

export function issueDemoQrCode(
  childId: string,
  guardianId: string | null
): QrCode {
  const world = readWorld();
  const child = world.children.find(c => c.id === childId);
  const createdAt = new Date();
  const id = demoId('qr');
  const live = demoLiveCodeFor(world, childId, guardianId, createdAt, id);
  if (!child || !live) throw demoUnavailable();
  const code: QrCode = {
    id,
    parent_id: child.parent_id,
    child_id: childId,
    guardian_id: guardianId,
    token: buildDemoLiveToken(live),
    expires_at: new Date(live.expiresAt).toISOString(),
    is_used: false,
    used_at: null,
    created_at: createdAt.toISOString(),
    child: {
      first_name: child.first_name,
      last_name: child.last_name,
      photo_url: null,
    },
  };
  writeWorld(world => ({
    ...world,
    qrCodes: [
      code,
      ...world.qrCodes.filter(
        c => !(c.child_id === childId && c.guardian_id === guardianId)
      ),
    ],
  }));
  return code;
}

export function activeDemoQrCodes(
  world: DemoWorld,
  filter: (code: QrCode) => boolean
): QrCode[] {
  const now = Date.now();
  return world.qrCodes.filter(code => isUsable(code, now) && filter(code));
}

function recentScans(childIds: Set<string>, limit: number): RecentScan[] {
  return readWorld()
    .pickupLogs.filter(log => childIds.has(log.child_id))
    .slice(0, limit)
    .map(log => ({
      id: log.id,
      child_id: log.child_id,
      guardian_id: log.guardian_id,
      pickup_time: log.pickup_time,
      status: log.status,
      denial_reason: log.denial_reason,
      child: log.child
        ? { first_name: log.child.first_name, last_name: log.child.last_name }
        : null,
      guardian: log.guardian ?? null,
    }));
}

export const demoQrService: QrService = {
  async getActiveQrCodes() {
    return activeDemoQrCodes(
      readWorld(),
      code => code.parent_id === DEMO_USER_IDS.parent
    );
  },

  async getQrCodesForChild(_parentId, childId) {
    return activeDemoQrCodes(
      readWorld(),
      code =>
        code.parent_id === DEMO_USER_IDS.parent && code.child_id === childId
    ).slice(0, 1);
  },

  async generateQrCode(_parentId, childId, guardianId) {
    return issueDemoQrCode(childId, guardianId);
  },

  async getRecentScans(_parentId, childId, limit = 5) {
    const own = readWorld()
      .children.filter(c => c.parent_id === DEMO_USER_IDS.parent)
      .map(c => c.id);
    return recentScans(new Set(childId ? [childId] : own), limit);
  },
};
