import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme, type AppTheme } from '@/theme';

export type AppIconTone =
  | 'primary'
  | 'accent'
  | 'green'
  | 'amber'
  | 'red'
  | 'neutral';

interface Palette {
  fg: string;
  detail: string;
  cut: string;
}

const STROKE = {
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const GLYPHS = {
  person: ({ fg }: Palette) => (
    <>
      <Circle cx="32" cy="23" r="8.5" fill={fg} />
      <Path d="M16 49c0-8.8 7.2-14.5 16-14.5S48 40.2 48 49v1H16z" fill={fg} />
    </>
  ),
  shield: ({ fg, cut }: Palette) => (
    <>
      <Path
        d="M32 13l15 5.5V30c0 10-6.3 17.5-15 21-8.7-3.5-15-11-15-21V18.5z"
        fill={fg}
      />
      <Path d="M25 32l5 5 9-10" stroke={cut} strokeWidth="4" {...STROKE} />
    </>
  ),
  moon: ({ fg, detail }: Palette) => (
    <>
      <Path d="M37 14a18 18 0 1 0 13 30A15.5 15.5 0 0 1 37 14z" fill={fg} />
      <Circle cx="47" cy="19" r="2.6" fill={detail} />
    </>
  ),
  bell: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M32 13c-7.2 0-12 5.6-12 12.5V34l-4.5 6.5h33L44 34v-8.5C44 18.6 39.2 13 32 13z"
        fill={fg}
      />
      <Circle cx="32" cy="46.5" r="4.5" fill={detail} />
    </>
  ),
  fingerprint: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M17 30a15 15 0 0 1 30 0v5"
        stroke={fg}
        strokeWidth="3.6"
        {...STROKE}
      />
      <Path
        d="M22.5 31a9.5 9.5 0 0 1 19 0v6c0 4.5-1.4 8.5-4 11.5"
        stroke={fg}
        strokeWidth="3.6"
        {...STROKE}
      />
      <Path
        d="M17.5 40c.8 3.4 2.2 6.4 4.3 8.8"
        stroke={fg}
        strokeWidth="3.6"
        {...STROKE}
      />
      <Path
        d="M32 31v6c0 5-1.7 9.4-4.8 12.6"
        stroke={detail}
        strokeWidth="3.6"
        {...STROKE}
      />
    </>
  ),
  globe: ({ fg, detail }: Palette) => (
    <>
      <Circle
        cx="32"
        cy="32"
        r="16.5"
        stroke={fg}
        strokeWidth="3.6"
        {...STROKE}
      />
      <Path
        d="M32 15.5c-5 4.6-7 10.3-7 16.5s2 11.9 7 16.5c5-4.6 7-10.3 7-16.5s-2-11.9-7-16.5z"
        stroke={fg}
        strokeWidth="3.2"
        {...STROKE}
      />
      <Path d="M16 32h32" stroke={detail} strokeWidth="3.6" {...STROKE} />
    </>
  ),
  help: ({ fg, cut }: Palette) => (
    <>
      <Circle cx="32" cy="32" r="17.5" fill={fg} />
      <Path
        d="M26.5 27a5.5 5.5 0 1 1 8 4.9c-1.6.9-2.5 2-2.5 3.6v1"
        stroke={cut}
        strokeWidth="4"
        {...STROKE}
      />
      <Circle cx="32" cy="43.5" r="2.4" fill={cut} />
    </>
  ),
  document: ({ fg, cut, detail }: Palette) => (
    <>
      <Path
        d="M21 12h15l10 10v27a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3z"
        fill={fg}
      />
      <Path d="M36 12v8a2 2 0 0 0 2 2h8" fill={detail} />
      <Path
        d="M24 32h16M24 39h16M24 46h9"
        stroke={cut}
        strokeWidth="3"
        {...STROKE}
      />
    </>
  ),
  lock: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M23.5 29v-5a8.5 8.5 0 0 1 17 0v5"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Rect x="17" y="28" width="30" height="23" rx="6" fill={fg} />
      <Circle cx="32" cy="38" r="3.4" fill={detail} />
      <Path d="M32 40v4.5" stroke={detail} strokeWidth="3" {...STROKE} />
    </>
  ),
  star: ({ fg }: Palette) => (
    <Path
      d="M32 12.5l5.7 11.6 12.8 1.9-9.3 9 2.2 12.8L32 41.8l-11.4 6 2.2-12.8-9.3-9 12.8-1.9z"
      fill={fg}
      stroke={fg}
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  logout: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M30 15H20a4 4 0 0 0-4 4v26a4 4 0 0 0 4 4h10"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Path
        d="M27 32h21M40 24l8 8-8 8"
        stroke={detail}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  trash: ({ fg, cut }: Palette) => (
    <>
      <Path
        d="M18 20h28M27 20v-3.5h10V20"
        stroke={fg}
        strokeWidth="4.2"
        {...STROKE}
      />
      <Path
        d="M21 24h22l-2 24a3.2 3.2 0 0 1-3.2 2.9H26.2A3.2 3.2 0 0 1 23 48z"
        fill={fg}
      />
      <Path
        d="M28.5 31v12M35.5 31v12"
        stroke={cut}
        strokeWidth="3"
        {...STROKE}
      />
    </>
  ),
  idCard: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="11" y="17" width="42" height="30" rx="6" fill={fg} />
      <Circle cx="24" cy="29" r="4.6" fill={cut} />
      <Path d="M16.5 41c.8-3.4 3.8-5.4 7.5-5.4s6.7 2 7.5 5.4z" fill={cut} />
      <Path
        d="M36 28h11M36 35h7"
        stroke={detail}
        strokeWidth="3.2"
        {...STROKE}
      />
    </>
  ),
  key: ({ fg, cut, detail }: Palette) => (
    <>
      <Circle cx="23" cy="32" r="10" fill={fg} />
      <Circle cx="23" cy="32" r="3.6" fill={cut} />
      <Path
        d="M32 32h18M44 32v7M50 32v5"
        stroke={detail}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  building: ({ fg, cut, detail }: Palette) => (
    <>
      <Path d="M14 50V25.5L32 14l18 11.5V50z" fill={fg} />
      <Rect x="20.5" y="29" width="7" height="6.5" rx="1.6" fill={cut} />
      <Rect x="36.5" y="29" width="7" height="6.5" rx="1.6" fill={cut} />
      <Path d="M28 50V43a4 4 0 0 1 8 0v7z" fill={detail} />
    </>
  ),
  mail: ({ fg, cut }: Palette) => (
    <>
      <Rect x="12" y="18" width="40" height="28" rx="6" fill={fg} />
      <Path d="M16 23l16 12 16-12" stroke={cut} strokeWidth="3.6" {...STROKE} />
    </>
  ),
  phone: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="20" y="11" width="24" height="42" rx="7" fill={fg} />
      <Rect x="24" y="17" width="16" height="25" rx="2.5" fill={cut} />
      <Circle cx="32" cy="47.5" r="2.4" fill={detail} />
    </>
  ),
  pin: ({ fg, cut }: Palette) => (
    <>
      <Path
        d="M32 11.5c-8.5 0-15.5 6.5-15.5 14.8C16.5 37 32 52.5 32 52.5S47.5 37 47.5 26.3c0-8.3-7-14.8-15.5-14.8z"
        fill={fg}
      />
      <Circle cx="32" cy="26.5" r="5.6" fill={cut} />
    </>
  ),
  qr: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="11" y="11" width="42" height="42" rx="10" fill={cut} />
      {[
        [16, 16],
        [36, 16],
        [16, 36],
      ].map(([x, y]) => (
        <React.Fragment key={`${x}-${y}`}>
          <Rect x={x} y={y} width="12" height="12" rx="3" fill={fg} />
          <Rect x={x + 3} y={y + 3} width="6" height="6" rx="1.4" fill={cut} />
          <Rect
            x={x + 4.6}
            y={y + 4.6}
            width="2.8"
            height="2.8"
            rx="0.6"
            fill={fg}
          />
        </React.Fragment>
      ))}
      <Rect x="36" y="36" width="5" height="5" rx="1.2" fill={detail} />
      <Rect x="43" y="36" width="5" height="5" rx="1.2" fill={fg} />
      <Rect x="36" y="43" width="5" height="5" rx="1.2" fill={fg} />
      <Rect x="43" y="43" width="5" height="5" rx="1.2" fill={detail} />
    </>
  ),
  family: ({ fg, detail }: Palette) => (
    <>
      <Circle cx="24" cy="17" r="5" fill={fg} />
      <Path
        d="M19 25C16.5 25 15 26.8 14.5 29L12 38A2 2 0 0 0 15.8 39L18 31V49A2.5 2.5 0 0 0 23 49V40H25V49A2.5 2.5 0 0 0 30 49V31L33.5 36A2 2 0 0 0 36.8 33.7L32.3 27.3C31.2 25.8 29.8 25 28 25Z"
        fill={fg}
      />
      <Circle cx="43" cy="28" r="3.8" fill={detail} />
      <Path
        d="M40 34C38.5 34 37.5 34.7 36.6 35.6L34 33.5A1.8 1.8 0 0 0 31.7 36.3L36 39.8A1.8 1.8 0 0 0 38.5 39.6L39 39V49.5A2 2 0 0 0 43 49.5V44H44V49.5A2 2 0 0 0 48 49.5V39L49.5 42A1.8 1.8 0 0 0 52.7 40.4L50.7 36.5C49.9 34.9 48.7 34 47 34Z"
        fill={detail}
      />
    </>
  ),
  userPlus: ({ fg, detail }: Palette) => (
    <>
      <Circle cx="26" cy="24" r="8" fill={fg} />
      <Path d="M11 49c0-8.3 6.7-13.5 15-13.5S41 40.7 41 49v1H11z" fill={fg} />
      <Path
        d="M47 18v14M40 25h14"
        stroke={detail}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  history: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M17.5 32A14.5 14.5 0 1 0 22 21.5"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Path d="M16.5 15.5v8h8" stroke={fg} strokeWidth="4.5" {...STROKE} />
      <Path d="M32 24v9l6.5 4" stroke={detail} strokeWidth="4.5" {...STROKE} />
    </>
  ),
  trend: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M14 45l11.5-12 8 7L48 24"
        stroke={fg}
        strokeWidth="5"
        {...STROKE}
      />
      <Path d="M39 23.5h9.5V33" stroke={detail} strokeWidth="5" {...STROKE} />
    </>
  ),
  check: ({ fg, cut }: Palette) => (
    <>
      <Circle cx="32" cy="32" r="17.5" fill={fg} />
      <Path
        d="M24 32.5l5.5 5.5 11-11"
        stroke={cut}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  cross: ({ fg, cut }: Palette) => (
    <>
      <Circle cx="32" cy="32" r="17.5" fill={fg} />
      <Path
        d="M25.5 25.5l13 13M38.5 25.5l-13 13"
        stroke={cut}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  clock: ({ fg, cut }: Palette) => (
    <>
      <Circle cx="32" cy="32" r="17.5" fill={fg} />
      <Path d="M32 22.5V33l7 4" stroke={cut} strokeWidth="4.2" {...STROKE} />
    </>
  ),
  calendar: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="13" y="17" width="38" height="34" rx="7" fill={fg} />
      <Path d="M13 24a7 7 0 0 1 7-7h24a7 7 0 0 1 7 7v4H13z" fill={detail} />
      <Path d="M23 13v8M41 13v8" stroke={fg} strokeWidth="4.2" {...STROKE} />
      {[20, 29.5, 39].map(x =>
        [33, 41.5].map(y => (
          <Rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="5"
            height="5"
            rx="1.4"
            fill={cut}
          />
        ))
      )}
    </>
  ),
  scan: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M15 25v-6a4 4 0 0 1 4-4h6M39 15h6a4 4 0 0 1 4 4v6M49 39v6a4 4 0 0 1-4 4h-6M25 49h-6a4 4 0 0 1-4-4v-6"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Path d="M13 32h38" stroke={detail} strokeWidth="4.5" {...STROKE} />
    </>
  ),
  warning: ({ fg, cut }: Palette) => (
    <>
      <Path
        d="M29.4 15.5a3 3 0 0 1 5.2 0l17 30a3 3 0 0 1-2.6 4.5H15a3 3 0 0 1-2.6-4.5z"
        fill={fg}
      />
      <Path d="M32 27v10" stroke={cut} strokeWidth="4.5" {...STROKE} />
      <Circle cx="32" cy="43.5" r="2.6" fill={cut} />
    </>
  ),
  students: ({ fg, detail }: Palette) => (
    <>
      <Path d="M32 15l21 9.5L32 34 11 24.5z" fill={fg} />
      <Path
        d="M19 29.5V38c0 3.6 5.8 7 13 7s13-3.4 13-7v-8.5L32 35.5z"
        fill={fg}
      />
      <Path d="M50 26v12" stroke={detail} strokeWidth="3.4" {...STROKE} />
      <Circle cx="50" cy="40.5" r="2.8" fill={detail} />
    </>
  ),
  edit: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M40.5 15.5a4 4 0 0 1 5.7 0l2.3 2.3a4 4 0 0 1 0 5.7L26 46l-10 2.5L18.5 38.5z"
        fill={fg}
      />
      <Path d="M36 20l8 8" stroke={detail} strokeWidth="3.4" {...STROKE} />
    </>
  ),
  info: ({ fg, cut }: Palette) => (
    <>
      <Circle cx="32" cy="32" r="17.5" fill={fg} />
      <Circle cx="32" cy="24" r="2.6" fill={cut} />
      <Path d="M32 30.5V41" stroke={cut} strokeWidth="4.5" {...STROKE} />
    </>
  ),
  refresh: ({ fg, detail }: Palette) => (
    <>
      <Path
        d="M46.5 28A15 15 0 0 0 19 23.5"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Path
        d="M17.5 36A15 15 0 0 0 45 40.5"
        stroke={fg}
        strokeWidth="4.5"
        {...STROKE}
      />
      <Path d="M18 15.5V24h8.5" stroke={detail} strokeWidth="4.5" {...STROKE} />
      <Path
        d="M46 48.5V40h-8.5"
        stroke={detail}
        strokeWidth="4.5"
        {...STROKE}
      />
    </>
  ),
  upload: ({ fg, cut }: Palette) => (
    <>
      <Path
        d="M21 46a10 10 0 0 1-1.6-19.9A13 13 0 0 1 45 24.5 10.8 10.8 0 0 1 44 46z"
        fill={fg}
      />
      <Path
        d="M32 42V30M26.5 35l5.5-5.5 5.5 5.5"
        stroke={cut}
        strokeWidth="4"
        {...STROKE}
      />
    </>
  ),
  camera: ({ fg, cut, detail }: Palette) => (
    <>
      <Path
        d="M25 17h14l3 5h6a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4h6z"
        fill={fg}
      />
      <Circle cx="32" cy="35" r="8.5" fill={cut} />
      <Circle cx="32" cy="35" r="4.5" fill={detail} />
    </>
  ),
  image: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="12" y="15" width="40" height="34" rx="7" fill={fg} />
      <Path d="M16 45l10-11 7 7 5-5 10 9z" fill={cut} />
      <Circle cx="40" cy="25" r="4" fill={detail} />
    </>
  ),
  passport: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="17" y="11" width="30" height="42" rx="5" fill={fg} />
      <Circle
        cx="32"
        cy="29"
        r="7.5"
        stroke={cut}
        strokeWidth="2.8"
        fill="none"
      />
      <Path
        d="M24.5 29h15M32 21.5c-2.4 2.2-3.4 4.8-3.4 7.5s1 5.3 3.4 7.5c2.4-2.2 3.4-4.8 3.4-7.5s-1-5.3-3.4-7.5z"
        stroke={cut}
        strokeWidth="2.2"
        fill="none"
      />
      <Path d="M25 44.5h14" stroke={detail} strokeWidth="3.2" {...STROKE} />
    </>
  ),
  license: ({ fg, cut, detail }: Palette) => (
    <>
      <Rect x="11" y="17" width="42" height="30" rx="6" fill={fg} />
      <Path
        d="M18 37l2.6-6.5a3 3 0 0 1 2.8-1.9h9.2a3 3 0 0 1 2.8 1.9L38 37v3.5H18z"
        fill={cut}
      />
      <Circle cx="22.5" cy="40.5" r="2.6" fill={fg} />
      <Circle cx="33.5" cy="40.5" r="2.6" fill={fg} />
      <Path d="M42 26h5M42 33h5" stroke={detail} strokeWidth="3" {...STROKE} />
    </>
  ),
} satisfies Record<string, (palette: Palette) => React.ReactElement>;

export type AppIconName = keyof typeof GLYPHS;

function toneColors(tone: AppIconTone, theme: AppTheme) {
  const ink = theme.isDark ? theme.text : theme.primary;
  switch (tone) {
    case 'primary':
      return { bg: theme.primaryBg, fg: ink, detail: theme.accent };
    case 'accent':
      return { bg: theme.accentBg, fg: theme.accent, detail: ink };
    case 'green':
      return { bg: theme.greenBg, fg: theme.green, detail: ink };
    case 'amber':
      return { bg: theme.amberBg, fg: theme.amber, detail: ink };
    case 'red':
      return { bg: theme.redBg, fg: theme.red, detail: theme.red };
    case 'neutral':
      return {
        bg: theme.iconBg,
        fg: theme.isDark ? theme.text : theme.textSecondary,
        detail: theme.accent,
      };
  }
}

interface AppIconProps {
  name: AppIconName;
  tone?: AppIconTone;
  size?: number;
  framed?: boolean;
}

export function AppIcon({
  name,
  tone = 'primary',
  size = 36,
  framed = true,
}: AppIconProps) {
  const theme = useTheme();
  const { bg, fg, detail } = toneColors(tone, theme);
  const Glyph = GLYPHS[name];

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessible={false}>
      {framed ? <Rect width="64" height="64" rx="20" fill={bg} /> : null}
      <Glyph fg={fg} detail={detail} cut={theme.card} />
    </Svg>
  );
}
