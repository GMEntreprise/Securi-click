import { z } from 'zod';
import { message } from '@/i18n/validation';

const email = () => z.string().email(message('errors:email_invalid'));
const password = () => z.string().min(8, message('errors:password_min'));
const accepted = (key: string) =>
  z.boolean().refine(val => val === true, message(key));
const passwordsMatch = {
  ...message('errors:passwords_mismatch'),
  path: ['confirm_password'],
};

export const loginSchema = z.object({
  email: email(),
  password: password(),
});

export const parentRegisterSchema = z
  .object({
    first_name: z.string().min(2, message('errors:first_name_required')),
    last_name: z.string().min(2, message('errors:last_name_required')),
    email: email(),
    phone: z.string().min(10, message('errors:phone_required')),
    password: password(),
    confirm_password: z.string(),
    accept_terms: accepted('errors:terms_required'),
    accept_privacy: accepted('errors:privacy_required'),
  })
  .refine(data => data.password === data.confirm_password, passwordsMatch);

export const schoolRegisterSchema = z
  .object({
    school_name: z.string().min(2, message('errors:school_name_required')),
    school_type: z.string().min(2, message('errors:school_type_required')),
    directory_uai: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9]{7}[A-Z]$/, message('errors:school_official_required')),
    email: email(),
    phone: z.string().min(10, message('errors:phone_required')),
    address: z.string().min(5, message('errors:address_required')),
    city: z.string().min(2, message('errors:city_required')),
    postal_code: z.string().min(5, message('errors:postal_code_required')),
    manager_first_name: z
      .string()
      .min(2, message('errors:director_first_name_required')),
    manager_last_name: z
      .string()
      .min(2, message('errors:director_last_name_required')),
    manager_function: z
      .string()
      .min(2, message('errors:director_role_required')),
    password: password(),
    confirm_password: z.string(),
    accept_terms: accepted('errors:terms_required'),
    accept_privacy: accepted('errors:privacy_required'),
  })
  .refine(data => data.password === data.confirm_password, passwordsMatch);

export const collectorOtpSchema = z.object({
  email: email(),
});

export type CollectorOtpFormData = z.infer<typeof collectorOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: email(),
});

export const resetPasswordSchema = z
  .object({
    password: password(),
    confirm_password: z.string(),
  })
  .refine(data => data.password === data.confirm_password, passwordsMatch);

export type LoginFormData = z.infer<typeof loginSchema>;
export type ParentRegisterFormData = z.infer<typeof parentRegisterSchema>;
export type SchoolRegisterFormData = z.infer<typeof schoolRegisterSchema>;

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
