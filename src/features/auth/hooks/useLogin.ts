import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { LoginCredentials } from '../types';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export const useLogin = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: ({ email, password }: LoginCredentials) =>
      authService.signInWithPassword(email, password),
    onMutate: async () => {
      setLoading(true);
    },
    onSuccess: session => {
      useAuthStore.getState().login(session);
    },
    onError: error => {
      setLoading(false);
      return error;
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};
