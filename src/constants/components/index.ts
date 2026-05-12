/**
 * Tokens attendus par les composants Reacticx (ex. Badge).
 */

export type BorderRadiusKey = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export const borderRadiusStyles: Record<BorderRadiusKey, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
