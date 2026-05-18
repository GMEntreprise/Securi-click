import { useMutation } from '@tanstack/react-query';
import type { LoginCredentials } from '../types';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';
import { saveLastEmail } from './useLastEmail';
import { clearDevRoleOverride } from '../utils/mapAuthSession';

// useLogin owns the session hydration after password login.
// It sets a flag so AuthStateSync ignores the duplicate SIGNED_IN event
// that Supabase emits for the same signInWithPassword call.
export let passwordLoginInProgress = false;

export const useLogin = () =>
  useMutation({
    mutationFn: async ({ email, password }: LoginCredentials) => {
      // Always clear any stale dev role override before a real password login
      // so the resolved role comes from the DB, not a leftover test value.
      if (__DEV__) await clearDevRoleOverride();
      return authService.signInWithPassword(email, password);
    },
    onMutate: () => {
      passwordLoginInProgress = true;
      if (__DEV__) console.log('[useLogin] mutate start');
    },
    onSuccess: (session, variables) => {
      if (__DEV__) console.log('[useLogin] onSuccess role=', session.user.role);
      saveLastEmail(variables.email);
      useAuthStore.getState().login(session);
    },
    onError: (err) => {
      if (__DEV__) console.log('[useLogin] onError', err.message);
    },
    onSettled: () => {
      passwordLoginInProgress = false;
      if (__DEV__) console.log('[useLogin] settled');
    },
  });
