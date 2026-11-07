import { i18n } from '@/i18n';

export type SupabaseErrorKind =
  | 'rate_limit'
  | 'network'
  | 'weak_password'
  | 'invalid_email'
  | 'not_found'
  | 'permission_denied'
  | 'unknown';

export interface SupabaseErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

export function classifySupabaseError(
  error: SupabaseErrorLike | null | undefined
): SupabaseErrorKind {
  if (!error) return 'unknown';
  const message = (error.message ?? '').toLowerCase();
  const code = error.code ?? '';

  if (
    error.status === 429 ||
    code === 'over_email_send_rate_limit' ||
    message.includes('rate limit')
  ) {
    return 'rate_limit';
  }
  if (
    message.includes('network request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network error')
  ) {
    return 'network';
  }
  if (
    message.includes('password should be') ||
    message.includes('weak password')
  ) {
    return 'weak_password';
  }
  if (message.includes('validate email') || message.includes('invalid email')) {
    return 'invalid_email';
  }
  if (code === '42501' || message.includes('permission denied')) {
    return 'permission_denied';
  }
  if (message.includes('not found')) return 'not_found';
  return 'unknown';
}

export function supabaseErrorMessage(kind: SupabaseErrorKind): string {
  return i18n.t(`errors:supabase_${kind}`);
}

export function toUserFacingError(
  error: SupabaseErrorLike | null | undefined
): Error {
  return new Error(supabaseErrorMessage(classifySupabaseError(error)));
}
