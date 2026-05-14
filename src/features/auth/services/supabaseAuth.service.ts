import type {
  AuthSession,
  User,
  RegisterParentData,
  RegisterSchoolData,
} from '../types';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '../utils/mapAuthSession';

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

  return mapSupabaseSessionToAuthSession(session);
}

async function registerParent(data: RegisterParentData): Promise<User> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: 'securiclick://auth/callback',
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
    id: authData.user.id,
    email: authData.user.email ?? data.email,
    role: 'parent',
    authUser: authData.user,
  };
}

async function registerSchool(data: RegisterSchoolData): Promise<User> {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: 'securiclick://auth/callback',
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
    id: authData.user.id,
    email: authData.user.email ?? data.email,
    role: 'school_admin',
    authUser: authData.user,
  };
}

async function inviteCollector(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'securiclick://auth/callback',
      data: { role: 'collector' },
    },
  });
  if (error) throw new Error(error.message);
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
  inviteCollector,
  restoreSession,
  signOut,
  forgotPassword,
};
