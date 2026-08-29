const PRIMARY = '#7ccf59';
const PRIMARY_DARK = '#63b545';

type ThemeMode = 'light' | 'dark';

export const gradients = {
  light: {
    primary: ['#9be274', '#7ccf59'] as const,
    primarySoft: ['#f4ffe9', '#e5f7d6'] as const,
    surface: ['#fffdf8', '#f6f0e5'] as const,
    glassTint: 'rgba(255,255,255,0.55)',
    overlay: 'rgba(0,0,0,0.04)',
  },
  dark: {
    primary: ['#9be274', '#63b545'] as const,
    primarySoft: ['rgba(124,207,89,0.25)', 'rgba(124,207,89,0.12)'] as const,
    surface: ['#201d18', '#171411'] as const,
    glassTint: 'rgba(32,29,24,0.65)',
    overlay: 'rgba(0,0,0,0.4)',
  },
};

export const motion = {
  spring: { friction: 7, tension: 80 },
  springSoft: { friction: 9, tension: 50 },
  springSnappy: { friction: 6, tension: 120 },
  fade: { duration: 220 },
};

export const palettes = {
  light: {
    mode: 'light' as ThemeMode,
    primary: PRIMARY,
    primaryContrast: '#15200f',
    primarySoft: '#edf8e5',
    background: '#f6f0e5',
    surface: '#fffdf8',
    surfaceMuted: '#efe7da',
    surfaceElevated: '#ffffff',
    text: '#1f1b16',
    textMuted: '#6b6257',
    textSubtle: '#9b8f81',
    border: '#e9dfd0',
    borderMuted: '#efe7da',
    danger: '#ef4444',
    success: '#22c55e',
    successSoft: '#dcfce7',
    warning: '#f59e0b',
    skeleton: '#e8dece',
    overlay: 'rgba(0,0,0,0.4)',
    shadow: '#7ccf59',
    inputBg: '#fbf7f0',
    badgeBg: '#1f1b16',
    badgeContrast: '#fffdf8',
    tabBarBg: '#fffdf8',
    tabBarBorder: '#fffdf8',
    tint: PRIMARY,
    tabIconDefault: '#9b8f81',
    tabIconSelected: PRIMARY,
    secondary: '#fbf7f0',
    backgroundSecondary: '#efe7da',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    primary: PRIMARY,
    primaryContrast: '#13210c',
    primarySoft: 'rgba(124,207,89,0.18)',
    background: '#13100d',
    surface: '#1b1814',
    surfaceMuted: '#27231e',
    surfaceElevated: '#221e19',
    text: '#f5ede5',
    textMuted: '#b0a69a',
    textSubtle: '#857a6c',
    border: '#2d2823',
    borderMuted: '#25211c',
    danger: '#f87171',
    success: '#4ade80',
    successSoft: 'rgba(74,222,128,0.15)',
    warning: '#fbbf24',
    skeleton: '#2b2621',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#000000',
    inputBg: '#201c17',
    badgeBg: '#7ccf59',
    badgeContrast: '#13210c',
    tabBarBg: '#1b1814',
    tabBarBorder: '#2d2823',
    tint: '#fffdf8',
    tabIconDefault: '#857a6c',
    tabIconSelected: PRIMARY,
    secondary: '#1b1814',
    backgroundSecondary: '#171411',
  },
};

export type Theme = typeof palettes.light;

export default {
  light: palettes.light,
  dark: palettes.dark,
};
