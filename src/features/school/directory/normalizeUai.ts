export const UAI_PATTERN = /^[0-9]{7}[A-Z]$/;

export function normalizeUai(value: string): string {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

export function isValidUaiFormat(value: string): boolean {
  return UAI_PATTERN.test(normalizeUai(value));
}
