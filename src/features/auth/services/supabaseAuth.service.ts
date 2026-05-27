import type {
  AuthSession,
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
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('invalid') ||
      msg.includes('credentials') ||
      msg.includes('password')
    ) {
      throw new Error('Email ou mot de passe incorrect.');
    }
    if (msg.includes('email not confirmed')) {
      throw new Error('Confirmez votre email avant de vous connecter.');
    }
    throw new Error('Une erreur est survenue. Réessayez.');
  }

  const session = data.session;
  if (!session) {
    throw new Error('Aucune session retournée');
  }

  return mapSupabaseSessionToAuthSession(session);
}

async function registerParent(data: RegisterParentData): Promise<void> {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if an account already exists with this email via a SECURITY DEFINER RPC
  // that queries auth.users server-side. Supabase signUp is silent on duplicate
  // emails to prevent enumeration — we must pre-check ourselves.
  const { data: emailTaken } = await supabase.rpc('check_email_exists', {
    p_email: normalizedEmail,
  });

  if (emailTaken) {
    throw new Error(
      'Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.'
    );
  }

  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
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
    const msg = error.message.toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      throw new Error(
        'Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.'
      );
    }
    throw new Error('Impossible de créer le compte. Réessayez.');
  }
}

async function registerSchool(data: RegisterSchoolData): Promise<void> {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Check if any account already exists with this email (school or parent).
  // Supabase signUp is silent on duplicate emails to prevent enumeration —
  // we must pre-check via a SECURITY DEFINER RPC that queries auth.users.
  const { data: emailTaken } = await supabase.rpc('check_email_exists', {
    p_email: normalizedEmail,
  });

  if (emailTaken) {
    throw new Error(
      'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.'
    );
  }

  const { error } = await supabase.auth.signUp({
    email: normalizedEmail,
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
    const msg = error.message.toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already been registered')
    ) {
      throw new Error(
        'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.'
      );
    }
    throw new Error('Impossible de créer le compte. Réessayez.');
  }
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

async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new Error(error.message);
}

async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'securiclick://auth/callback',
  });
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
  deleteAccount,
};
