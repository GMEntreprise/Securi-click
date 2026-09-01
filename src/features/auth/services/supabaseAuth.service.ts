import type {
  AuthSession,
  RegisterParentData,
  RegisterSchoolData,
} from '../types';
import { supabase } from '@/lib/supabase/client';
import { mapSupabaseSessionToAuthSession } from '../utils/mapAuthSession';
import { directoryService } from '@/features/school/directory';
import { resolveSignUpOutcome } from '../utils/signUpOutcome';

/**
 * Traduit une erreur Supabase signUp en message clair et actionnable.
 * On distingue les cas fréquents (doublon, rate limit email, erreur DB)
 * au lieu d'un générique « Impossible de créer le compte » qui masque tout.
 */
const UNUSABLE_SIGNUP_MESSAGE =
  "L'inscription n'a pas abouti. Réessayez dans quelques instants.";

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
    return new Error(
      'Un compte existe déjà avec cet email. Connectez-vous ou réinitialisez votre mot de passe.'
    );
  }
  if (
    code === 'over_email_send_rate_limit' ||
    error.status === 429 ||
    msg.includes('rate limit')
  ) {
    return new Error(
      "Trop de demandes d'inscription pour le moment. Réessayez dans quelques minutes."
    );
  }
  if (msg.includes('database error') || msg.includes('saving new user')) {
    return new Error(
      'Erreur serveur lors de la création du compte. Notre équipe a été informée, réessayez plus tard.'
    );
  }
  if (msg.includes('password')) {
    return new Error(
      'Le mot de passe ne respecte pas les exigences de sécurité.'
    );
  }
  // Cas inconnu : conserver le message réel en dev pour le diagnostic
  if (__DEV__) {
    return new Error(`Inscription échouée: ${error.message}`);
  }
  return new Error('Impossible de créer le compte. Réessayez.');
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
    throw new Error(UNUSABLE_SIGNUP_MESSAGE);
  }
}

async function registerSchool(data: RegisterSchoolData): Promise<void> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const establishment = await directoryService.byUai(data.directory_uai);
  if (establishment.status === 'network_error') {
    throw new Error(
      'Connexion impossible. Vérifiez votre réseau et réessayez.'
    );
  }
  if (establishment.status !== 'found') {
    throw new Error(
      'Établissement introuvable. Vérifiez le code UAI sélectionné.'
    );
  }
  if (!establishment.establishment.is_active) {
    throw new Error("Cet établissement n'est actuellement pas disponible.");
  }
  if (establishment.establishment.is_claimed) {
    throw new Error(
      'Cet établissement possède déjà un compte SecuriClick. Connectez-vous ou contactez le support.'
    );
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
      throw new Error(
        'Cet établissement possède déjà un compte SecuriClick. Connectez-vous ou contactez le support.'
      );
    }
    throw mapSignUpError(error);
  }
  if (resolveSignUpOutcome(signUp) === 'unusable') {
    throw new Error(UNUSABLE_SIGNUP_MESSAGE);
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
