import { useCallback, useEffect, useState } from 'react';
import { useSession } from '@/features/auth/store/auth.store';
import { localSecurityService, type BiometricCapability } from '../services/localSecurity.service';

interface LocalSecurityState {
  capability: BiometricCapability | null;
  isEnabled: boolean;
  isLoading: boolean;
  isMutating: boolean;
}

export function useLocalSecurity() {
  const session = useSession();
  const uid = session?.user.id ?? '';

  const [state, setState] = useState<LocalSecurityState>({
    capability: null,
    isEnabled: false,
    isLoading: true,
    isMutating: false,
  });

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    Promise.all([
      localSecurityService.getCapability(),
      localSecurityService.isEnabled(uid),
    ]).then(([capability, isEnabled]) => {
      if (!cancelled) setState(s => ({ ...s, capability, isEnabled, isLoading: false }));
    }).catch(() => {
      if (!cancelled) setState(s => ({ ...s, isLoading: false }));
    });
    return () => { cancelled = true; };
  }, [uid]);

  const enable = useCallback(async (): Promise<'success' | 'cancelled' | 'unavailable'> => {
    if (!uid || !state.capability?.isAvailable || !state.capability.isEnrolled) {
      return 'unavailable';
    }
    setState(s => ({ ...s, isMutating: true }));
    try {
      const ok = await localSecurityService.enable(uid);
      if (ok) setState(s => ({ ...s, isEnabled: true, isMutating: false }));
      else setState(s => ({ ...s, isMutating: false }));
      return ok ? 'success' : 'cancelled';
    } catch {
      setState(s => ({ ...s, isMutating: false }));
      return 'cancelled';
    }
  }, [uid, state.capability]);

  const disable = useCallback(async (): Promise<'success' | 'cancelled'> => {
    if (!uid) return 'cancelled';
    setState(s => ({ ...s, isMutating: true }));
    try {
      const ok = await localSecurityService.disable(uid);
      if (ok) setState(s => ({ ...s, isEnabled: false, isMutating: false }));
      else setState(s => ({ ...s, isMutating: false }));
      return ok ? 'success' : 'cancelled';
    } catch {
      setState(s => ({ ...s, isMutating: false }));
      return 'cancelled';
    }
  }, [uid]);

  const test = useCallback(async (): Promise<boolean> => {
    return localSecurityService.test();
  }, []);

  return {
    capability: state.capability,
    isEnabled: state.isEnabled,
    isLoading: state.isLoading,
    isMutating: state.isMutating,
    enable,
    disable,
    test,
  };
}
