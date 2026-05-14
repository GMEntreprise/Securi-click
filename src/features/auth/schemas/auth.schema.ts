import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
});

export const parentRegisterSchema = z
  .object({
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
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export const schoolRegisterSchema = z
  .object({
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
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export const collectorRegisterSchema = z
  .object({
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
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, '8 caractères minimum'),
    confirm_password: z.string(),
  })
  .refine(data => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirm_password'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ParentRegisterFormData = z.infer<typeof parentRegisterSchema>;
export type SchoolRegisterFormData = z.infer<typeof schoolRegisterSchema>;
export type CollectorRegisterFormData = z.infer<typeof collectorRegisterSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
