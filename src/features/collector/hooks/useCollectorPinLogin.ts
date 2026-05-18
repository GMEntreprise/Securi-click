import { useMutation } from '@tanstack/react-query';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { AuthSession } from '@/features/auth/types';

export let collectorPinLoginInProgress = false;

interface CollectorLoginPayload {
  email: string;
  pin: string;
}

interface CollectorLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: {
    id: string;
    email: string;
    role: 'collector';
    first_name: string;
    last_name: string;
  };
  guardian_id: string;
  access_code_version: number;
  child_first_name: string;
}

interface CollectorLoginError {
  error: 'no_active_guardian' | 'pin_locked' | 'invalid_pin' | 'server_error' | 'missing_fields';
}

export function formatPinError(code: string): string {
  if (code === 'invalid_pin')        return 'Code incorrect. Vérifiez auprès du parent.';
  if (code === 'pin_locked')         return 'Trop de tentatives. Réessayez dans 15 minutes.';
  if (code === 'no_active_guardian') return 'Aucun accès actif pour cet email. Vérifiez avec le parent.';
  return 'Une erreur est survenue. Réessayez.';
}

export function useCollectorPinLogin(onVerified: (version: number) => void) {
  const nav = useAppNavigation();

  return useMutation({
    onMutate: () => { collectorPinLoginInProgress = true; },
    mutationFn: async ({ email, pin }: CollectorLoginPayload): Promise<CollectorLoginResponse> => {
      if (__DEV__) console.log('[PinLogin] calling edge function', email);
      const { data, error } = await supabase.functions.invoke('collector-login', {
        body: { email: email.trim().toLowerCase(), pin },
      });

      if (__DEV__) console.log('[PinLogin] raw data=', JSON.stringify(data), 'error=', error?.message);

      if (error) throw new Error(error.message);

      const result = data as CollectorLoginResponse | CollectorLoginError;
      if ('error' in result) throw new Error(result.error);

      return result as CollectorLoginResponse;
    },

    onError: () => { collectorPinLoginInProgress = false; },

    onSuccess: async (data) => {
      if (__DEV__) console.log('[PinLogin] onSuccess access_code_version=', data.access_code_version);
      if (__DEV__) console.log('[PinLogin] flag before setSession=', collectorPinLoginInProgress);
      // Hydrate Supabase auth client with the session returned by the Edge Function
      await supabase.auth.setSession({
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
      });
      if (__DEV__) console.log('[PinLogin] flag after setSession=', collectorPinLoginInProgress);

      // Build AuthSession for the Zustand store
      const authSession: AuthSession = {
        user: {
          id:       data.user.id,
          email:    data.user.email,
          role:     'collector',
          authUser: null as any,
          profile: {
            id:         data.user.id,
            first_name: data.user.first_name,
            last_name:  data.user.last_name,
            role:       'collector',
          },
        },
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    data.expires_at,
      };

      // Mark PIN verified BEFORE login() so NavigationGuard sees isVerified=true
      // when it reacts to the auth state change — markVerified updates store synchronously.
      onVerified(data.access_code_version);

      useAuthStore.getState().login(authSession);
      collectorPinLoginInProgress = false;
      nav.goToCollectorDashboard();
    },
  });
}
