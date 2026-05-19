import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export const useResetPassword = () =>
  useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
  });
