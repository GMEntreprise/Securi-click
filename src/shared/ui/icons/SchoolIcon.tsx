import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

interface SchoolIconProps {
  size?: number;
}

export function SchoolIcon({ size = 60 }: SchoolIconProps) {
  const theme = useTheme();
  const foreground = theme.isDark ? theme.text : theme.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Rect width="64" height="64" rx="20" fill={theme.primaryBg} />
      <Path
        d="M32 12V21"
        fill="none"
        stroke={foreground}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path d="M33 11H44L41 15L44 19H33Z" fill={theme.accent} />
      <Rect x="11" y="32" width="42" height="20" rx="3" fill={foreground} />
      <Path d="M22 52V29H18L32 19L46 29H42V52Z" fill={foreground} />
      <Circle cx="32" cy="29" r="4.5" fill={theme.card} />
      <Path
        d="M32 26.5V29H34"
        fill="none"
        stroke={foreground}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="28" y="40" width="8" height="12" rx="2" fill={theme.accent} />
      <Rect x="15" y="37" width="5" height="5" rx="1" fill={theme.card} />
      <Rect x="44" y="37" width="5" height="5" rx="1" fill={theme.card} />
    </Svg>
  );
}
