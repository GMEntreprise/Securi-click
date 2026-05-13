import { useContext } from 'react';
import { ThemeContext } from '@/shared/ui/organisms/theme-switch/context';
import { lightTheme, darkTheme } from './tokens';
import type { AppTheme } from './tokens';

export function useTheme(): AppTheme {
  const ctx = useContext(ThemeContext);
  const isDark = ctx?.isDark ?? false;
  return isDark ? darkTheme : lightTheme;
}
