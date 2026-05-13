import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './tokens';
import type { AppTheme } from './tokens';

export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkTheme : lightTheme;
}
