// Single source of truth for all design tokens.
// Add new tokens here — never hardcode colors elsewhere.

export const palette = {
  // Grays
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',

  // Dark surface (GitHub-inspired)
  dark0: '#0d1117', // page background
  dark1: '#161b22', // card / input surface
  dark2: '#1c2128', // icon background
  dark3: '#21262d', // border / separator
  dark4: '#30363d', // muted border / switch track off
  dark5: '#6e7681', // placeholder text

  // Light surface (cream-warm)
  light0: '#f9f5f0', // page background
  light1: '#ffffff', // card / input surface
  light2: '#f3f4f6', // icon background
  light3: '#f0ede8', // border / separator
  light4: '#e5e7eb', // muted border / switch track off
  light5: '#9ca3af', // placeholder text

  // Accents
  orange: '#f97316',
  orangeDeep: '#ea580c',
  orangeBg: 'rgba(249,115,22,0.10)',

  blue: '#3b82f6',
  blueDeep: '#1d4ed8',
  blueNavy: '#1e3a8a',
  blueBg: 'rgba(59,130,246,0.12)',
  navyBg: 'rgba(30,58,138,0.10)',

  // Status
  green: '#10b981',
  greenBg: 'rgba(16,185,129,0.12)',
  amber: '#f59e0b',
  amberBg: 'rgba(245,158,11,0.12)',
  red: '#ef4444',
  redBg: 'rgba(239,68,68,0.10)',

  white: '#ffffff',
  black: '#000000',
} as const;

// Shared theme interface — the contract every theme must satisfy.
export interface AppTheme {
  bg: string;
  card: string;
  input: string;
  iconBg: string;
  cardBorder: string;
  separator: string;
  inputBorder: string;
  switchTrackOff: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  accent: string;
  accentDeep: string;
  accentBg: string;
  primary: string;
  primaryBg: string;
  tabGradient: [string, string];
  switchTrackOn: string;
  profileEditBg: string;
  ctaBg: string;
  ctaBorder: string;
  green: string;
  greenBg: string;
  amber: string;
  amberBg: string;
  red: string;
  redBg: string;
  isDark: boolean;
}

export const lightTheme: AppTheme = {
  bg: palette.light0,
  card: palette.light1,
  input: palette.light1,
  iconBg: palette.light2,
  cardBorder: palette.light3,
  separator: palette.light3,
  inputBorder: palette.light4,
  switchTrackOff: palette.light4,
  text: palette.gray900,
  textSecondary: palette.gray500,
  textMuted: palette.gray400,
  placeholder: palette.light5,
  accent: palette.orange,
  accentDeep: palette.orangeDeep,
  accentBg: palette.orangeBg,
  primary: palette.blueNavy,
  primaryBg: palette.navyBg,
  tabGradient: [palette.orange, palette.orangeDeep],
  switchTrackOn: palette.orange,
  profileEditBg: palette.gray100,
  ctaBg: 'rgba(249,245,240,0.97)',
  ctaBorder: 'rgba(0,0,0,0.06)',
  green: palette.green,
  greenBg: palette.greenBg,
  amber: palette.amber,
  amberBg: palette.amberBg,
  red: palette.red,
  redBg: palette.redBg,
  isDark: false,
};

export const darkTheme: AppTheme = {
  bg: palette.dark0,
  card: palette.dark1,
  input: palette.dark1,
  iconBg: palette.dark2,
  cardBorder: palette.dark3,
  separator: palette.dark3,
  inputBorder: palette.dark3,
  switchTrackOff: palette.dark4,
  text: palette.gray50,
  textSecondary: palette.gray400,
  textMuted: palette.gray500,
  placeholder: palette.dark5,
  accent: palette.blue,
  accentDeep: palette.blueDeep,
  accentBg: palette.blueBg,
  primary: palette.blueNavy,
  primaryBg: palette.navyBg,
  tabGradient: [palette.blueNavy, palette.blueDeep],
  switchTrackOn: palette.blue,
  profileEditBg: palette.dark3,
  ctaBg: 'rgba(13,17,23,0.97)',
  ctaBorder: palette.dark3,
  green: palette.green,
  greenBg: palette.greenBg,
  amber: palette.amber,
  amberBg: palette.amberBg,
  red: palette.red,
  redBg: palette.redBg,
  isDark: true,
};
