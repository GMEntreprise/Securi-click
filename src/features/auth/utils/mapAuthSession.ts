import type { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User, UserProfile, UserRole } from '../types';

const DEV_ROLE_KEY = 'securiclick_dev_role_override';

export async function setDevRoleOverride(role: string): Promise<void> {
  if (!__DEV__) return;
  await SecureStore.setItemAsync(DEV_ROLE_KEY, role);
}

export async function clearDevRoleOverride(): Promise<void> {
  if (!__DEV__) return;
  await SecureStore.deleteItemAsync(DEV_ROLE_KEY);
}

async function getDevRoleOverride(): Promise<UserRole | null> {
  if (!__DEV__) return null;
  try {
    const stored = await SecureStore.getItemAsync(DEV_ROLE_KEY);
    if (
      stored === 'parent' || stored === 'collector' ||
      stored === 'staff' || stored === 'school_admin' || stored === 'super_admin'
    ) return stored as UserRole;
  } catch {}
  return null;
}

function resolveRole(
  profile: UserProfile | null,
  metadata: Record<string, unknown> | undefined
): UserRole {
  const fromProfile = profile?.role;
  if (
    fromProfile === 'parent' ||
    fromProfile === 'collector' ||
    fromProfile === 'staff' ||
    fromProfile === 'school_admin' ||
    fromProfile === 'super_admin'
  ) {
    return fromProfile;
  }
  const metaRole = metadata?.role;
  if (
    metaRole === 'parent' ||
    metaRole === 'collector' ||
    metaRole === 'staff' ||
    metaRole === 'school_admin' ||
    metaRole === 'super_admin'
  ) {
    return metaRole as UserRole;
  }
  return 'parent';
}

export async function mapSupabaseSessionToAuthSession(
  session: Session,
  knownProfile?: UserProfile | null
): Promise<AuthSession> {
  const authUser = session.user;
  const email = authUser.email ?? '';

  let profile: UserProfile | null = knownProfile ?? null;

  if (profile === null) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, phone, school_id, role')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (!error && data) {
      profile = {
        id: String(data.id),
        first_name: String(data.first_name ?? ''),
        last_name: String(data.last_name ?? ''),
        phone: data.phone ? String(data.phone) : undefined,
        school_id: data.school_id ? String(data.school_id) : undefined,
        role: data.role as UserProfile['role'],
      };
    }
  }

  const dbRole = resolveRole(
    profile,
    authUser.user_metadata as Record<string, unknown> | undefined
  );

  // In dev builds: honour the role override set by DevLogin so a test account
  // with role=parent in DB can be used to exercise the collector dashboard.
  const devOverride = await getDevRoleOverride();
  const role: UserRole = devOverride ?? dbRole;

  const user: User = {
    id: authUser.id,
    email,
    role,
    authUser,
    profile,
  };

  return {
    user,
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? '',
    expires_at: session.expires_at ?? 0,
  };
}
