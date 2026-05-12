import type { AuthSession } from '../types';
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

  return mapSupabaseSessionToAuthSession(session);
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

export const authService = {
  signInWithPassword,
  restoreSession,
  signOut,
  subscribeAuth,
};
