import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { AuthSession, User, UserProfile, UserRole } from '../types';

function resolveRole(
  profile: UserProfile | null,
  metadata: Record<string, unknown> | undefined
): UserRole {
  const fromProfile = profile?.role;
  if (
    fromProfile === 'parent' ||
    fromProfile === 'staff' ||
    fromProfile === 'school_admin' ||
    fromProfile === 'super_admin'
  ) {
    return fromProfile;
  }
  const metaRole = metadata?.role;
  if (
    metaRole === 'parent' ||
    metaRole === 'staff' ||
    metaRole === 'school_admin' ||
    metaRole === 'super_admin'
  ) {
    return metaRole;
  }
  return 'parent';
}

export async function mapSupabaseSessionToAuthSession(
  session: Session
): Promise<AuthSession> {
  const authUser = session.user;
  const email = authUser.email ?? '';

  let profile: UserProfile | null = null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, phone, school_id, role')
    .eq('user_id', authUser.id)
    .maybeSingle();

  if (!error && data) {
    profile = {
      id: String(data.id),
      full_name: String(data.full_name ?? ''),
      phone: data.phone ? String(data.phone) : undefined,
      school_id: data.school_id ? String(data.school_id) : undefined,
      role: data.role as UserProfile['role'],
    };
  }

  const role = resolveRole(
    profile,
    authUser.user_metadata as Record<string, unknown> | undefined
  );

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
