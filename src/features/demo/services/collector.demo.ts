import type {
  CollectorQrCode,
  CollectorRecentScan,
  CollectorService,
} from '@/features/collector/services/collector.service';
import type {
  CollectorGuardian,
  CollectorIdentity,
} from '@/features/collector/types';
import { DEMO_USER_IDS } from '../session';
import { activeDemoQrCodes, issueDemoQrCode } from './qr.demo';
import {
  demoId,
  demoUnavailable,
  nowIso,
  readWorld,
  writeWorld,
} from './world';

function myGuardians() {
  return readWorld().guardians.filter(
    g => g.collector_user_id === DEMO_USER_IDS.collector
  );
}

function toCollectorQr(
  code: ReturnType<typeof issueDemoQrCode>
): CollectorQrCode {
  return {
    id: code.id,
    child_id: code.child_id,
    guardian_id: code.guardian_id,
    token: code.token,
    expires_at: code.expires_at,
    is_used: code.is_used,
    created_at: code.created_at,
    child: code.child ?? null,
  };
}

export const demoCollectorService: CollectorService = {
  async getMyGuardians() {
    const world = readWorld();
    return myGuardians().map((g): CollectorGuardian => {
      const child = world.children.find(c => c.id === g.child_id);
      return {
        id: g.id,
        parent_id: g.parent_id,
        child_id: g.child_id,
        first_name: g.first_name,
        last_name: g.last_name,
        phone: g.phone ?? '',
        email: g.email,
        relationship: g.relationship,
        photo_url: null,
        priority: g.priority,
        is_active: g.is_active,
        identity_status: g.identity_status,
        identity_verified: g.identity_status === 'verified',
        collector_user_id: g.collector_user_id ?? null,
        created_at: g.created_at,
        updated_at: g.updated_at,
        child: child
          ? {
              id: child.id,
              first_name: child.first_name,
              last_name: child.last_name,
              photo_url: null,
              class_name: child.class_name,
              medical_notes: null,
              school: {
                id: world.school.id,
                name: world.school.name,
                city: world.school.city,
                type: world.school.type,
                verified: world.school.verified,
                external_id: null,
                address: world.school.address,
                postal_code: world.school.postal_code,
              },
            }
          : null,
      };
    });
  },

  async getMyIdentity() {
    return readWorld().collectorIdentity;
  },

  async getMyPickupLogs(_collectorUserId, limit = 20) {
    const ids = new Set(myGuardians().map(g => g.id));
    return readWorld()
      .pickupLogs.filter(log => !!log.guardian_id && ids.has(log.guardian_id))
      .slice(0, limit)
      .map(log => ({
        id: log.id,
        child_id: log.child_id,
        guardian_id: log.guardian_id,
        pickup_time: log.pickup_time,
        status: log.status,
        denial_reason: log.denial_reason,
        child: log.child ?? null,
      }));
  },

  async upsertIdentity(
    collectorUserId,
    parentId,
    documentType,
    frontPath,
    backPath,
    selfiePath
  ) {
    const now = nowIso();
    const identity: CollectorIdentity = {
      id: readWorld().collectorIdentity?.id ?? demoId('identity'),
      collector_user_id: collectorUserId,
      parent_id: parentId,
      document_type: documentType,
      front_path: frontPath,
      back_path: backPath,
      selfie_path: selfiePath,
      verification_status: 'pending',
      verified_at: null,
      verified_by: null,
      refusal_reason: null,
      created_at: readWorld().collectorIdentity?.created_at ?? now,
      updated_at: now,
    };
    writeWorld(world => ({ ...world, collectorIdentity: identity }));
    return identity;
  },

  async uploadIdentityDocument(_collectorUserId, _parentId, _slot, uri) {
    return uri;
  },

  async getSignedIdentityUrl(path) {
    return path;
  },

  async getPendingInvitesByEmail() {
    return [];
  },

  async acceptInvite() {
    throw demoUnavailable();
  },

  async getCollectorProfile() {
    return readWorld().collectorProfile;
  },

  async updateCollectorProfile(_userId, payload) {
    writeWorld(world => ({
      ...world,
      collectorProfile: { ...world.collectorProfile, ...payload },
    }));
  },

  async uploadAvatar(_userId, uri) {
    return uri;
  },

  async updateAvatarUrl(_userId, avatarUrl) {
    writeWorld(world => ({
      ...world,
      collectorProfile: {
        ...world.collectorProfile,
        avatar_url: avatarUrl || null,
      },
    }));
  },

  async getCollectorQrCode(_collectorUserId, childId) {
    const guardians = myGuardians().filter(g => g.is_active);
    const target = childId ?? guardians[0]?.child_id;
    const ids = new Set(guardians.map(g => g.id));
    const code = activeDemoQrCodes(
      readWorld(),
      c => c.child_id === target && !!c.guardian_id && ids.has(c.guardian_id)
    )[0];
    return code ? toCollectorQr(code) : null;
  },

  async getCollectorRecentScans(_collectorUserId, childId, limit = 5) {
    const ids = new Set(myGuardians().map(g => g.id));
    return readWorld()
      .pickupLogs.filter(log => !!log.guardian_id && ids.has(log.guardian_id))
      .filter(log => !childId || log.child_id === childId)
      .slice(0, limit)
      .map(
        (log): CollectorRecentScan => ({
          id: log.id,
          child_id: log.child_id,
          guardian_id: log.guardian_id,
          pickup_time: log.pickup_time,
          status: log.status,
          denial_reason: log.denial_reason,
          child: log.child
            ? {
                first_name: log.child.first_name,
                last_name: log.child.last_name,
              }
            : null,
          guardian: log.guardian ?? null,
        })
      );
  },

  async generateCollectorQrCode(_collectorUserId, childId, guardianId) {
    const guardian = myGuardians().find(g => g.id === guardianId);
    if (!guardian?.is_active || guardian.child_id !== childId) {
      throw demoUnavailable();
    }
    return toCollectorQr(issueDemoQrCode(childId, guardianId));
  },
};
