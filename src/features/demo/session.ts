import type { AuthSession, UserRole } from '@/features/auth/types';
import type { DemoRole } from './domain/types';

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

export function createDemoSession(role: DemoRole): AuthSession {
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
      profile: null,
    },
    access_token: '',
    refresh_token: '',
    expires_at: 0,
  };
}
