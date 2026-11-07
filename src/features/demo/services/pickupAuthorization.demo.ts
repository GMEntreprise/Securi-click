import type { PickupAuthorizationService } from '@/features/parent/services/pickupAuthorization.service';
import { DEMO_USER_IDS } from '../session';
import { demoId, nowIso, readWorld, writeWorld } from './world';

export const demoPickupAuthorizationService: PickupAuthorizationService = {
  async getForGuardian(childId, guardianId) {
    return (
      readWorld().authorizations.find(
        a => a.child_id === childId && a.guardian_id === guardianId
      ) ?? null
    );
  },

  async getForChild(childId) {
    return readWorld().authorizations.filter(a => a.child_id === childId);
  },

  async getCollectorSchedules(collectorUserId) {
    const world = readWorld();
    const guardianIds = new Set(
      world.guardians
        .filter(g => g.collector_user_id === collectorUserId && g.is_active)
        .map(g => g.id)
    );
    return world.authorizations.filter(
      a => a.is_active && !!a.guardian_id && guardianIds.has(a.guardian_id)
    );
  },

  async upsert(payload) {
    const existing = readWorld().authorizations.find(
      a =>
        a.child_id === payload.child_id && a.guardian_id === payload.guardian_id
    );
    const id = existing?.id ?? demoId('authorization');
    const windows = payload.time_windows;
    const next = {
      id,
      parent_id: DEMO_USER_IDS.parent,
      child_id: payload.child_id,
      guardian_id: payload.guardian_id,
      monday: payload.monday,
      tuesday: payload.tuesday,
      wednesday: payload.wednesday,
      thursday: payload.thursday,
      friday: payload.friday,
      start_time: windows[0]?.start ?? '15:00',
      end_time: windows[windows.length - 1]?.end ?? '18:00',
      time_windows: windows,
      timezone: 'Europe/Paris',
      reminder_before: payload.reminder_before,
      is_active: payload.is_active,
      expires_at: existing?.expires_at ?? null,
      next_pickup_at: null,
      last_reminded_at: null,
      created_at: existing?.created_at ?? nowIso(),
      updated_at: nowIso(),
    };
    writeWorld(world => ({
      ...world,
      authorizations: [next, ...world.authorizations.filter(a => a.id !== id)],
    }));
    return { success: true, id };
  },

  async deactivate(childId, guardianId) {
    writeWorld(world => ({
      ...world,
      authorizations: world.authorizations.map(a =>
        a.child_id === childId && a.guardian_id === guardianId
          ? { ...a, is_active: false, updated_at: nowIso() }
          : a
      ),
    }));
  },
};
