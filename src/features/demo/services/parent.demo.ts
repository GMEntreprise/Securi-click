import type { ParentService } from '@/features/parent/services/parent.service';
import type { Child, Guardian, PickupLog } from '@/features/parent/types';
import type { SchoolChild } from '@/features/school/types';
import type { DemoGuardian } from '../domain/types';
import { DEMO_USER_IDS } from '../session';
import {
  demoId,
  demoUnavailable,
  nowIso,
  readWorld,
  writeWorld,
} from './world';

function toChild(row: SchoolChild): Child {
  const { school } = readWorld();
  return {
    id: row.id,
    parent_id: row.parent_id,
    school_id: row.school_id,
    first_name: row.first_name,
    last_name: row.last_name,
    date_of_birth: row.date_of_birth,
    photo_url: row.photo_url,
    class_name: row.class_name,
    medical_notes: row.medical_notes,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
    school: row.school_id
      ? {
          id: school.id,
          name: school.name,
          city: school.city,
          type: school.type,
          verified: school.verified,
          external_id: school.external_id,
        }
      : null,
  };
}

function toGuardian(row: DemoGuardian): Guardian {
  const { identity_status: _identityStatus, ...guardian } = row;
  return guardian;
}

function ownChildren(): SchoolChild[] {
  return readWorld().children.filter(c => c.parent_id === DEMO_USER_IDS.parent);
}

function findGuardian(guardianId: string): DemoGuardian {
  const row = readWorld().guardians.find(g => g.id === guardianId);
  if (!row) throw demoUnavailable();
  return row;
}

function patchGuardian(guardianId: string, patch: Partial<DemoGuardian>): void {
  writeWorld(world => ({
    ...world,
    guardians: world.guardians.map(g =>
      g.id === guardianId ? { ...g, ...patch, updated_at: nowIso() } : g
    ),
  }));
}

export const demoParentService: ParentService = {
  async getProfile() {
    return readWorld().parentProfile;
  },

  async updateProfile(_userId, payload) {
    writeWorld(world => ({
      ...world,
      parentProfile: {
        ...world.parentProfile,
        ...payload,
        updated_at: nowIso(),
      },
    }));
    return readWorld().parentProfile;
  },

  async updateAvatar(_userId, avatarUrl) {
    writeWorld(world => ({
      ...world,
      parentProfile: {
        ...world.parentProfile,
        avatar_url: avatarUrl || null,
        updated_at: nowIso(),
      },
    }));
  },

  async changePassword() {},

  async getChildren() {
    return ownChildren().map(toChild);
  },

  async getChild(childId) {
    const row = ownChildren().find(c => c.id === childId);
    if (!row) throw demoUnavailable();
    return toChild(row);
  },

  async addChild(_parentId, payload) {
    const id = demoId('child');
    const created: SchoolChild = {
      id,
      parent_id: DEMO_USER_IDS.parent,
      school_id: readWorld().school.id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      date_of_birth: payload.date_of_birth ?? '',
      photo_url: null,
      class_name: payload.class_name,
      medical_notes: null,
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
      parent: {
        first_name: readWorld().parentProfile.first_name,
        last_name: readWorld().parentProfile.last_name,
        phone: readWorld().parentProfile.phone,
      },
    };
    writeWorld(world => ({ ...world, children: [...world.children, created] }));
    return toChild(created);
  },

  async updateChild(childId, payload) {
    writeWorld(world => ({
      ...world,
      children: world.children.map(c =>
        c.id === childId
          ? {
              ...c,
              first_name: payload.first_name ?? c.first_name,
              last_name: payload.last_name ?? c.last_name,
              class_name: payload.class_name ?? c.class_name,
              updated_at: nowIso(),
            }
          : c
      ),
    }));
    return demoParentService.getChild(childId);
  },

  async deleteChild(childId) {
    writeWorld(world => ({
      ...world,
      children: world.children.filter(c => c.id !== childId),
      guardians: world.guardians.filter(g => g.child_id !== childId),
    }));
  },

  async getExistingCollectors() {
    const byEmail = new Map<string, Guardian>();
    for (const row of readWorld().guardians) {
      const key = row.email ?? row.id;
      if (!byEmail.has(key)) byEmail.set(key, toGuardian(row));
    }
    return [...byEmail.values()].sort((a, b) =>
      a.first_name.localeCompare(b.first_name)
    );
  },

  async linkCollectorToChild(_parentId, childId, payload) {
    const duplicate = readWorld().guardians.some(
      g =>
        g.child_id === childId &&
        !!payload.email &&
        g.email?.toLowerCase() === payload.email.toLowerCase()
    );
    if (duplicate) throw demoUnavailable();
    const created: DemoGuardian = {
      id: demoId('guardian'),
      parent_id: DEMO_USER_IDS.parent,
      child_id: childId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone,
      email: payload.email,
      relationship: payload.relationship,
      photo_url: null,
      priority: 1,
      is_active: true,
      collector_user_id: payload.collector_user_id,
      access_code_hash: 'demo',
      identity_status: 'none',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    writeWorld(world => ({
      ...world,
      guardians: [...world.guardians, created],
    }));
    return toGuardian(created);
  },

  async getGuardians(childId) {
    return readWorld()
      .guardians.filter(g => g.child_id === childId)
      .map(toGuardian);
  },

  async getGuardian(guardianId) {
    return toGuardian(findGuardian(guardianId));
  },

  async addGuardian(_parentId, payload) {
    return demoParentService.linkCollectorToChild(
      DEMO_USER_IDS.parent,
      payload.child_id,
      {
        collector_user_id: null,
        access_code_hash: null,
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        email: payload.email ?? null,
        relationship: payload.relationship,
      }
    );
  },

  async updateGuardian(guardianId, payload) {
    const target = findGuardian(guardianId);
    const sameEmail = (g: DemoGuardian) =>
      !!target.email && g.email === target.email;
    writeWorld(world => ({
      ...world,
      guardians: world.guardians.map(g =>
        g.id === guardianId || sameEmail(g)
          ? {
              ...g,
              first_name: payload.first_name,
              last_name: payload.last_name,
              phone: payload.phone ?? g.phone,
              email: payload.email,
              relationship: payload.relationship,
              updated_at: nowIso(),
            }
          : g
      ),
    }));
    return toGuardian(findGuardian(guardianId));
  },

  async toggleGuardian(guardianId, isActive) {
    findGuardian(guardianId);
    patchGuardian(guardianId, { is_active: isActive });
  },

  async deleteGuardian(guardianId) {
    writeWorld(world => ({
      ...world,
      guardians: world.guardians.filter(g => g.id !== guardianId),
      authorizations: world.authorizations.filter(
        a => a.guardian_id !== guardianId
      ),
    }));
  },

  async getPickupLogs(_parentId, limit = 50) {
    const own = new Set(ownChildren().map(c => c.id));
    return readWorld()
      .pickupLogs.filter((log: PickupLog) => own.has(log.child_id))
      .slice(0, limit);
  },

  async uploadImage() {
    throw demoUnavailable();
  },

  async inviteGuardian(params) {
    const email = params.p_email.trim().toLowerCase();
    const duplicate = readWorld().guardians.some(
      g => g.child_id === params.p_child_id && g.email?.toLowerCase() === email
    );
    if (duplicate) {
      return { error: { message: 'duplicate_guardian_email', code: '23505' } };
    }
    const created: DemoGuardian = {
      id: demoId('guardian'),
      parent_id: DEMO_USER_IDS.parent,
      child_id: params.p_child_id,
      first_name: params.p_first_name,
      last_name: params.p_last_name,
      phone: params.p_phone,
      email,
      relationship: params.p_relationship,
      photo_url: null,
      priority: 1,
      is_active: true,
      collector_user_id: null,
      access_code_hash: 'demo',
      identity_status: 'none',
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    writeWorld(world => ({
      ...world,
      guardians: [...world.guardians, created],
    }));
    return { error: null };
  },

  async updateGuardianPin(guardianId) {
    findGuardian(guardianId);
    return { error: null };
  },
};
