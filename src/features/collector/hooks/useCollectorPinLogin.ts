import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { markPinVerified } from './useCollectorSession';

interface ResolvePinPayload {
  role: 'collector';
  access_code_version: number;
  guardian_id: string;
  first_name: string;
  last_name: string;
  child_first_name: string;
}

interface ResolvePinError {
  error: 'no_active_guardian' | 'pin_locked' | 'invalid_pin';
}

function formatPinError(code: string): string {
  if (code === 'invalid_pin') return 'Code incorrect. Vérifiez auprès du parent.';
  if (code === 'pin_locked') return 'Trop de tentatives. Réessayez dans 15 minutes.';
  if (code === 'no_active_guardian') return 'Aucun accès actif. Demandez une invitation au parent.';
  return 'Une erreur est survenue. Réessayez.';
}

export function useCollectorPinLogin(onVerified: (version: number) => void) {
  const router = useRouter();

  return useMutation({
    mutationFn: async (pin: string): Promise<ResolvePinPayload> => {
      const { data, error } = await supabase.rpc('resolve_collector_pin', {
        p_pin: pin,
      });

      if (error) throw new Error(error.message);

      const result = data as ResolvePinPayload | ResolvePinError;
      if ('error' in result) throw new Error(result.error);

      return result as ResolvePinPayload;
    },

    onSuccess: async (data) => {
      try {
        await markPinVerified(data.access_code_version);
      } catch {
        // SecureStore failure is non-blocking — PIN is verified in memory for this session
      }
      onVerified(data.access_code_version);
      router.replace('/(collector-tabs)' as any);
    },
  });
}

export { formatPinError };
