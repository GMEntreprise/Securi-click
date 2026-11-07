import type {
  AuthSession,
  RegisterParentData,
  RegisterSchoolData,
} from '../types';
import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { readStoredSession, supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '../utils/mapAuthSession';
import { directoryService } from '@/features/school/directory';
import { resolveSignUpOutcome } from '../utils/signUpOutcome';
import { toAuthError } from '../utils/authError';
import { i18n } from '@/i18n';
import {
  ACCOUNT_OWNED_BUCKETS,
  collectIdentityDocumentPaths,
} from '../utils/accountStorage';

/**
 * Traduit une erreur Supabase signUp en message clair et actionnable.
 * On distingue les cas fréquents (doublon, rate limit email, erreur DB)
 * au lieu d'un générique « Impossible de créer le compte » qui masque tout.
 */

function mapSignUpError(error: {
  message: string;
  code?: string;
  status?: number;
}): Error {
  const msg = (error.message ?? '').toLowerCase();
  const code = error.code ?? '';

  if (
    msg.includes('already registered') ||
    msg.includes('already been registered')
  ) {
    return new Error(i18n.t('errors:signup_email_taken'));
  }
  if (
    code === 'over_email_send_rate_limit' ||
    error.status === 429 ||
    msg.includes('rate limit')
  ) {
    return new Error(i18n.t('errors:signup_rate_limit'));
  }
  if (msg.includes('database error') || msg.includes('saving new user')) {
    return new Error(i18n.t('errors:signup_server'));
  }
  if (msg.includes('password')) {
    return new Error(i18n.t('errors:supabase_weak_password'));
  }
  // Cas inconnu : conserver le message réel en dev pour le diagnostic
  if (__DEV__) {
    return new Error(
      i18n.t('errors:signup_failed_dev', { message: error.message })
    );
  }
  return new Error(i18n.t('errors:signup_failed'));
}

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
      throw new Error(i18n.t('errors:login_invalid'));
    }
    if (msg.includes('email not confirmed')) {
      throw new Error(i18n.t('errors:login_unconfirmed'));
    }
    throw new Error(i18n.t('errors:generic'));
  }

  const session = data.session;
  if (!session) {
    throw new Error(i18n.t('errors:login_no_session'));
  }

  try {
    return await mapSupabaseSessionToAuthSession(session);
  } catch {
    await supabase.auth.signOut();
    throw new Error(i18n.t('errors:profile_missing'));
  }
}

async function registerParent(data: RegisterParentData): Promise<void> {
  const normalizedEmail = data.email.trim().toLowerCase();

  const { data: signUp, error } = await supabase.auth.signUp({
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
    throw mapSignUpError(error);
  }
  if (resolveSignUpOutcome(signUp) === 'unusable') {
    throw new Error(i18n.t('errors:signup_unusable'));
  }
}

async function registerSchool(data: RegisterSchoolData): Promise<void> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const establishment = await directoryService.byUai(data.directory_uai);
  if (establishment.status === 'network_error') {
    throw new Error(i18n.t('errors:supabase_network'));
  }
  if (establishment.status !== 'found') {
    throw new Error(i18n.t('errors:school_not_found'));
  }
  if (!establishment.establishment.is_active) {
    throw new Error(i18n.t('errors:school_unavailable'));
  }
  if (establishment.establishment.is_claimed) {
    throw new Error(i18n.t('errors:school_claimed'));
  }

  const { data: signUp, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: data.password,
    options: {
      emailRedirectTo: 'securiclick://auth/callback',
      data: {
        school_name: data.school_name,
        school_type: data.school_type,
        directory_uai: data.directory_uai.trim().toUpperCase(),
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
    const latest = await directoryService.byUai(data.directory_uai);
    if (latest.status === 'found' && latest.establishment.is_claimed) {
      throw new Error(i18n.t('errors:school_claimed'));
    }
    throw mapSignUpError(error);
  }
  if (resolveSignUpOutcome(signUp) === 'unusable') {
    throw new Error(i18n.t('errors:signup_unusable'));
  }
}

async function inviteCollector(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: 'securiclick://auth/callback',
      data: { role: 'collector' },
    },
  });
  if (error) throw toAuthError(error);
}

const STARTUP_NETWORK_DEADLINE_MS = 4_000;

function withStartupDeadline<T>(pending: Promise<T>): Promise<T | 'deadline'> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<'deadline'>(resolve => {
    timer = setTimeout(() => resolve('deadline'), STARTUP_NETWORK_DEADLINE_MS);
  });
  return Promise.race([pending, deadline]).finally(() => clearTimeout(timer));
}

async function restoreFromDevice(): Promise<AuthSession | null> {
  const stored = await readStoredSession();
  if (!stored) return null;
  try {
    return await mapSupabaseSessionToAuthSession(stored);
  } catch {
    return null;
  }
}

async function mapSession(session: Session): Promise<AuthSession | null> {
  try {
    return await mapSupabaseSessionToAuthSession(session);
  } catch {
    return null;
  }
}

async function restoreSession(): Promise<AuthSession | null> {
  const outcome = await withStartupDeadline(supabase.auth.getSession());
  if (outcome === 'deadline') return restoreFromDevice();

  const {
    data: { session },
    error,
  } = outcome;

  if (error) {
    return isAuthRetryableFetchError(error) ? restoreFromDevice() : null;
  }
  if (!session?.access_token) return null;

  const expiresAtMs = (session.expires_at ?? 0) * 1000;
  if (Date.now() >= expiresAtMs) {
    const refreshOutcome = await withStartupDeadline(
      supabase.auth.refreshSession({
        refresh_token: session.refresh_token ?? '',
      })
    );
    if (refreshOutcome === 'deadline') return restoreFromDevice();

    const { data: refreshed, error: refreshError } = refreshOutcome;
    if (refreshError && isAuthRetryableFetchError(refreshError)) {
      return restoreFromDevice();
    }
    if (refreshError || !refreshed.session) {
      await supabase.auth.signOut();
      return null;
    }

    return mapSession(refreshed.session);
  }

  return mapSession(session);
}

async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

async function purgeOwnStorage(userId: string): Promise<void> {
  const { data: identities } = await supabase
    .from('collector_identities')
    .select('front_path, back_path, selfie_path')
    .eq('collector_user_id', userId);

  const documentPaths = collectIdentityDocumentPaths(identities);
  if (documentPaths.length > 0) {
    await supabase.storage.from('identity-documents').remove(documentPaths);
  }

  for (const bucket of ACCOUNT_OWNED_BUCKETS) {
    const { data: objects } = await supabase.storage
      .from(bucket)
      .list(userId, { limit: 100 });
    const paths = (objects ?? [])
      .filter(object => object.name)
      .map(object => `${userId}/${object.name}`);
    if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
  }
}

async function deleteAccount(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await purgeOwnStorage(user.id);
    } catch {
      /* empty */
    }
  }

  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw toAuthError(error);
}

async function forgotPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(
    email.trim().toLowerCase(),
    { redirectTo: 'securiclick://auth/callback' }
  );
  if (error) throw toAuthError(error);
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
