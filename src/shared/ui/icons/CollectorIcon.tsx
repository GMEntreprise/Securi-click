import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

interface CollectorIconProps {
  size?: number;
}

export function CollectorIcon({ size = 60 }: CollectorIconProps) {
  const theme = useTheme();
  const foreground = theme.isDark ? theme.text : theme.primary;

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Rect width="64" height="64" rx="20" fill={theme.primaryBg} />
      <Circle cx="27" cy="21" r="8" fill={foreground} />
      <Path
        d="M12 46C12 37.7 18.7 32 27 32S42 37.7 42 46V48H15A3 3 0 0 1 12 45Z"
        fill={foreground}
      />
      <Rect x="32" y="31" width="23" height="25" rx="7" fill={theme.card} />
      <Rect x="35" y="34" width="17" height="19" rx="4" fill={theme.accent} />
      <Path
        d="M39 43.5L42 46.5L48 40.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
