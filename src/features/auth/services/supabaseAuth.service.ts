import type {
  AuthSession,
  User,
  RegisterParentData,
  RegisterSchoolData,
  RegisterCollectorData,
} from '../types';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '../utils/mapAuthSession';

export type AuthListener = (session: AuthSession | null) => void;

function subscribeAuth(listener: AuthListener): { unsubscribe: () => void } {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, sess) => {
    if (event === 'INITIAL_SESSION') {
      return;
    }
    if (!sess) {
      listener(null);
      return;
    }
    listener(await mapSupabaseSessionToAuthSession(sess));
  });

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthSession> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  const session = data.session;
  if (!session) {
    throw new Error('Aucune session retournée');
  }

  // Fetch user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  return mapSupabaseSessionToAuthSession({
    ...session,
    user: {
      ...session.user,
      profile: profile || undefined,
      role: profile?.role as User['role'],
    },
  });
}

async function registerParent(data: RegisterParentData): Promise<User> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        role: 'parent',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!authData.user) {
    throw new Error('No user created');
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      role: 'parent',
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    ...authData.user,
    role: 'parent',
  };
}

async function registerSchool(data: RegisterSchoolData): Promise<User> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        school_name: data.school_name,
        school_type: data.school_type,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        manager_first_name: data.manager_first_name,
        manager_last_name: data.manager_last_name,
        manager_function: data.manager_function,
        role: 'school_admin',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!authData.user) {
    throw new Error('No user created');
  }

  // Create school record
  const { error: schoolError } = await supabase
    .from('schools')
    .insert({
      name: data.school_name,
      type: data.school_type,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      manager_first_name: data.manager_first_name,
      manager_last_name: data.manager_last_name,
      manager_function: data.manager_function,
      admin_user_id: authData.user.id,
    })
    .select()
    .single();

  if (schoolError) {
    throw new Error(schoolError.message);
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      first_name: data.manager_first_name,
      last_name: data.manager_last_name,
      phone: data.phone,
      role: 'school_admin',
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    ...authData.user,
    role: 'school_admin',
  };
}

async function registerCollector(data: RegisterCollectorData): Promise<User> {
  // Verify invitation token first
  const { data: inviteData, error: inviteError } = await supabase
    .from('invited_collectors')
    .select('*')
    .eq('token', data.invitation_token)
    .eq('used', false)
    .single();

  if (inviteError || !inviteData) {
    throw new Error('Invalid or expired invitation');
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        role: 'collector',
        invited_by: inviteData.parent_id,
      },
    },
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('No user created');
  }

  // Mark invitation as used
  await supabase
    .from('invited_collectors')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', inviteData.id);

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      role: 'collector',
    })
    .select()
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  return {
    ...authData.user,
    role: 'collector',
  };
}

async function restoreSession(): Promise<AuthSession | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    return null;
  }

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (Date.now() >= expiresAtMs) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession({
        refresh_token: session.refresh_token ?? '',
      });

    if (refreshError || !refreshed.session) {
      await supabase.auth.signOut();
      return null;
    }

    return mapSupabaseSessionToAuthSession(refreshed.session);
  }

  return mapSupabaseSessionToAuthSession(session);
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) {
    throw new Error(error.message);
  }
}

export const authService = {
  signInWithPassword,
  registerParent,
  registerSchool,
  registerCollector,
  restoreSession,
  signOut,
  subscribeAuth,
  forgotPassword,
};
