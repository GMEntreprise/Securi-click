export type SignUpOutcome = 'created' | 'confirmation_pending' | 'unusable';

interface SignUpResponseLike {
  user?: { id?: string; identities?: unknown[] } | null;
  session?: unknown | null;
}

export function resolveSignUpOutcome(
  response: SignUpResponseLike | null | undefined
): SignUpOutcome {
  if (!response?.user?.id) return 'unusable';
  return response.session ? 'created' : 'confirmation_pending';
}
