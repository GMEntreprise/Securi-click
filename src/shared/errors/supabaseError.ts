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

const GENERIC_MESSAGES: Record<SupabaseErrorKind, string> = {
  rate_limit:
    'Trop de demandes en peu de temps. Réessayez dans quelques minutes.',
  network: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
  weak_password: 'Le mot de passe ne respecte pas les exigences de sécurité.',
  invalid_email: "L'adresse email saisie n'est pas valide.",
  not_found: 'Cet élément est introuvable ou a été supprimé.',
  permission_denied: "Vous n'avez pas accès à cette information.",
  unknown: 'Une erreur est survenue. Réessayez dans quelques instants.',
};

export function supabaseErrorMessage(kind: SupabaseErrorKind): string {
  return GENERIC_MESSAGES[kind];
}

export function toUserFacingError(
  error: SupabaseErrorLike | null | undefined
): Error {
  return new Error(supabaseErrorMessage(classifySupabaseError(error)));
}
