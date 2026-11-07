import { i18n } from '@/i18n';
import {
  classifySupabaseError,
  type SupabaseErrorKind,
  type SupabaseErrorLike,
} from '@/shared/errors/supabaseError';

export type AuthErrorKind = SupabaseErrorKind;

const AUTH_KEYS: Record<AuthErrorKind, string> = {
  rate_limit: 'errors:supabase_rate_limit',
  network: 'errors:supabase_network',
  weak_password: 'errors:supabase_weak_password',
  invalid_email: 'errors:supabase_invalid_email',
  not_found: 'errors:auth_not_found',
  permission_denied: 'errors:auth_permission_denied',
  unknown: 'errors:supabase_unknown',
};

export function classifyAuthError(
  error: SupabaseErrorLike | null | undefined
): AuthErrorKind {
  return classifySupabaseError(error);
}

export function authErrorMessage(kind: AuthErrorKind): string {
  return i18n.t(AUTH_KEYS[kind]);
}

export function toAuthError(
  error: SupabaseErrorLike | null | undefined
): Error {
  return new Error(authErrorMessage(classifyAuthError(error)));
}
