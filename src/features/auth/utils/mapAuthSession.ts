import type { Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase/client';
import { resolveSessionRole } from './resolveSessionRole';
import type { AuthSession, User, UserProfile, UserRole } from '../types';

const DEV_ROLE_KEY = 'securiclick_dev_role_override';
const ROLE_CACHE_PREFIX = 'securiclick_session_role_';

export const PROFILE_UNAVAILABLE_ERROR = 'profile_unavailable';

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
    const resolution = resolveSessionRole({
      profileRole: stored,
      profileFetchFailed: false,
    });
    return resolution.status === 'resolved' ? resolution.role : null;
  } catch {
    return null;
  }
}

async function readCachedRole(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ROLE_CACHE_PREFIX + userId);
  } catch {
    return null;
  }
}

async function cacheRole(userId: string, role: UserRole): Promise<void> {
  try {
    await SecureStore.setItemAsync(ROLE_CACHE_PREFIX + userId, role);
  } catch {
    /* empty */
  }
}

export async function mapSupabaseSessionToAuthSession(
  session: Session,
  knownProfile?: UserProfile | null
): Promise<AuthSession> {
  const authUser = session.user;
  let profile: UserProfile | null = knownProfile ?? null;
  let profileFetchFailed = false;

  if (profile === null) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, phone, school_id, role')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (error) {
      profileFetchFailed = true;
    } else if (data) {
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

  const resolution = resolveSessionRole({
    profileRole: profile?.role,
    cachedRole: profileFetchFailed ? await readCachedRole(authUser.id) : null,
    profileFetchFailed,
  });

  if (resolution.status === 'unavailable') {
    throw new Error(PROFILE_UNAVAILABLE_ERROR);
  }
  if (resolution.shouldCache) await cacheRole(authUser.id, resolution.role);

  const devOverride = await getDevRoleOverride();
  const role: UserRole = devOverride ?? resolution.role;

  const user: User = {
    id: authUser.id,
    email: authUser.email ?? '',
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
