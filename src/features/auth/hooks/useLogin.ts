import { useMutation } from '@tanstack/react-query';
import type { LoginCredentials } from '../types';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';

export const useLogin = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      authService.signInWithPassword(email, password),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: session => {
      useAuthStore.getState().login(session);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};
