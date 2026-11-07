import type { AuthSession, UserProfile, UserRole } from '@/features/auth/types';
import type { DemoRole, DemoWorld } from './domain/types';

export const DEMO_USER_IDS: Record<DemoRole, string> = {
  parent: 'demo-parent',
  collector: 'demo-collector',
  establishment: 'demo-school-admin',
};

const SESSION_ROLES: Record<DemoRole, UserRole> = {
  parent: 'parent',
  collector: 'collector',
  establishment: 'school_admin',
};

function demoProfile(
  role: DemoRole,
  world: DemoWorld,
  id: string
): UserProfile {
  switch (role) {
    case 'parent':
      return {
        id,
        first_name: world.parentProfile.first_name,
        last_name: world.parentProfile.last_name,
        role: 'parent',
      };
    case 'collector':
      return {
        id,
        first_name: world.collectorProfile.first_name,
        last_name: world.collectorProfile.last_name,
        role: 'collector',
      };
    case 'establishment':
      return {
        id,
        first_name: world.school.manager_first_name,
        last_name: world.school.manager_last_name,
        school_id: world.school.id,
        role: 'school_admin',
      };
  }
}

export function createDemoSession(
  role: DemoRole,
  world: DemoWorld
): AuthSession {
  const id = DEMO_USER_IDS[role];
  const email = `${id}@demo.invalid`;
  return {
    user: {
      id,
      email,
      role: SESSION_ROLES[role],
      authUser: {
        id,
        email,
        aud: 'demo',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date(0).toISOString(),
      },
      profile: demoProfile(role, world, id),
    },
    access_token: '',
    refresh_token: '',
    expires_at: 0,
  };
}
