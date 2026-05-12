import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';
import { queryClient } from '@/lib/queryClient';
import type { LoginFormValues } from '../schemas/login.schema';

export function useLogin() {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: ({ email, password }: LoginFormValues) =>
      authService.signInWithPassword(email, password),
    onMutate: async () => {
      setLoading(true);
      await queryClient.cancelQueries({ queryKey: ['user'] });
    },
    onSuccess: session => {
      useAuthStore.getState().login(session);
      queryClient.setQueryData(['user'], session.user);
    },
    onError: () => {
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}
