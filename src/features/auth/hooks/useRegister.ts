import { useMutation } from '@tanstack/react-query';
import type {
  RegisterParentData,
  RegisterSchoolData,
  InviteCollectorData,
} from '../types';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';
import { saveLastEmail, saveLastCollectorEmail } from './useLastEmail';

export const useRegisterParent = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: (data: RegisterParentData) => authService.registerParent(data) as Promise<void>,
    onMutate: async () => { setLoading(true); },
    onSuccess: (_, variables) => {
      saveLastEmail(variables.email);
      setLoading(false);
    },
    onError: error => {
      setLoading(false);
      return error;
    },
  });
};

export const useRegisterSchool = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: (data: RegisterSchoolData) => authService.registerSchool(data) as Promise<void>,
    onMutate: async () => { setLoading(true); },
    onSuccess: (_, variables) => {
      saveLastEmail(variables.email);
      setLoading(false);
    },
    onError: error => {
      setLoading(false);
      return error;
    },
  });
};

export const useInviteCollector = () => {
  const setLoading = useAuthStore(s => s.setLoading);
  return useMutation({
    mutationFn: (data: InviteCollectorData) =>
      authService.inviteCollector(data.email),
    onMutate: () => { setLoading(true); },
    onSuccess: (_, variables) => {
      saveLastCollectorEmail(variables.email);
    },
    onSettled: () => { setLoading(false); },
  });
};
