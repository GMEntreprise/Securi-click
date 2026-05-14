import { useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type {
  RegisterParentData,
  RegisterSchoolData,
  RegisterCollectorData,
} from '../types';
import { authService } from '../services/supabaseAuth.service';
import { useAuthStore } from '../store/auth.store';

const parentRegisterSchema = z.object({
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone requis'),
  password: z.string().min(8, '8 caractères minimum'),
  confirm_password: z.string(),
  accept_terms: z
    .boolean()
    .refine(val => val === true, 'Vous devez accepter les CGU'),
  accept_privacy: z
    .boolean()
    .refine(
      val => val === true,
      'Vous devez accepter la politique de confidentialité'
    ),
});

const schoolRegisterSchema = z.object({
  school_name: z.string().min(2, "Nom de l'établissement requis"),
  school_type: z.string().min(2, "Type d'établissement requis"),
  email: z.string().email('Email invalide'),
  phone: z.string().min(10, 'Téléphone requis'),
  address: z.string().min(5, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  postal_code: z.string().min(5, 'Code postal requis'),
  manager_first_name: z.string().min(2, 'Prénom du responsable requis'),
  manager_last_name: z.string().min(2, 'Nom du responsable requis'),
  manager_function: z.string().min(2, 'Fonction du responsable requise'),
  password: z.string().min(8, '8 caractères minimum'),
  confirm_password: z.string(),
  accept_terms: z
    .boolean()
    .refine(val => val === true, 'Vous devez accepter les CGU'),
  accept_privacy: z
    .boolean()
    .refine(
      val => val === true,
      'Vous devez accepter la politique de confidentialité'
    ),
});

const collectorRegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
  confirm_password: z.string(),
  invitation_token: z.string().min(1, "Token d'invitation requis"),
  accept_terms: z
    .boolean()
    .refine(val => val === true, 'Vous devez accepter les CGU'),
  accept_privacy: z
    .boolean()
    .refine(
      val => val === true,
      'Vous devez accepter la politique de confidentialité'
    ),
});

export const useRegisterParent = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: (data: RegisterParentData) => authService.registerParent(data),
    onMutate: async () => {
      setLoading(true);
    },
    onSuccess: user => {
      setLoading(false);
      // Navigation handled by UI
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
    mutationFn: (data: RegisterSchoolData) => authService.registerSchool(data),
    onMutate: async () => {
      setLoading(true);
    },
    onSuccess: user => {
      setLoading(false);
      // Navigation handled by UI
    },
    onError: error => {
      setLoading(false);
      return error;
    },
  });
};

export const useRegisterCollector = () => {
  const setLoading = useAuthStore(s => s.setLoading);

  return useMutation({
    mutationFn: (data: RegisterCollectorData) =>
      authService.registerCollector(data),
    onMutate: async () => {
      setLoading(true);
    },
    onSuccess: user => {
      setLoading(false);
      // Navigation handled by UI
    },
    onError: error => {
      setLoading(false);
      return error;
    },
  });
};
