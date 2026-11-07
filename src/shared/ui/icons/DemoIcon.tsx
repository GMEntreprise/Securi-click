import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';

interface DemoIconProps {
  size?: number;
}

export function DemoIcon({ size = 60 }: DemoIconProps) {
  const theme = useTheme();

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      <Rect width="64" height="64" rx="20" fill={theme.accentBg} />
      <Rect x="13" y="13" width="38" height="38" rx="8" fill={theme.card} />
      <Path
        d="M19 19H27V27H19V19ZM21.5 21.5V24.5H24.5V21.5H21.5ZM37 19H45V27H37V19ZM39.5 21.5V24.5H42.5V21.5H39.5ZM19 37H27V45H19V37ZM21.5 39.5V42.5H24.5V39.5H21.5ZM30 19H33V22H30V19ZM30 25H34V28H30V25ZM34 30H38V33H34V30ZM28 31H32V34H28V31ZM37 36H40V39H37V36ZM31 37H34V41H31V37ZM43 31H46V34H43V31ZM39 42H44V45H39V42ZM28 43H31V46H28V43Z"
        fill={theme.text}
        fillRule="evenodd"
      />
      <Path
        d="M49 9V14M46.5 11.5H51.5"
        fill="none"
        stroke={theme.accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <Path d="M14 49L16 51L14 53L12 51Z" fill={theme.accent} />
    </Svg>
  );
}
