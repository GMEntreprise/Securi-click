import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/supabaseAuth.service';

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
