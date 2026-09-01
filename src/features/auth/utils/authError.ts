import {
  classifySupabaseError,
  type SupabaseErrorKind,
  type SupabaseErrorLike,
} from '@/shared/errors/supabaseError';

export type AuthErrorKind = SupabaseErrorKind;

const AUTH_MESSAGES: Record<AuthErrorKind, string> = {
  rate_limit:
    'Trop de demandes en peu de temps. Réessayez dans quelques minutes.',
  network: 'Connexion impossible. Vérifiez votre réseau et réessayez.',
  weak_password: 'Le mot de passe ne respecte pas les exigences de sécurité.',
  invalid_email: "L'adresse email saisie n'est pas valide.",
  not_found: 'Aucun compte ne correspond à ces informations.',
  permission_denied: "Cette action n'est pas autorisée.",
  unknown: 'Une erreur est survenue. Réessayez dans quelques instants.',
};

export function classifyAuthError(
  error: SupabaseErrorLike | null | undefined
): AuthErrorKind {
  return classifySupabaseError(error);
}

export function authErrorMessage(kind: AuthErrorKind): string {
  return AUTH_MESSAGES[kind];
}

export function toAuthError(
  error: SupabaseErrorLike | null | undefined
): Error {
  return new Error(authErrorMessage(classifyAuthError(error)));
}
