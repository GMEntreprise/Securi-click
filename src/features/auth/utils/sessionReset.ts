export function shouldResetQueryCache(
  previousUserId: string | null,
  nextUserId: string | null
): boolean {
  return previousUserId !== nextUserId;
}
