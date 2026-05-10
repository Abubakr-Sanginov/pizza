const PRIMARY = '#ff7000';
const PRIMARY_DARK = '#ff5400';

type ThemeMode = 'light' | 'dark';

export const gradients = {
  light: {
    primary: ['#ff8a3d', '#ff6b00'] as const,
    primarySoft: ['#fff6ed', '#ffe7d0'] as const,
    surface: ['#ffffff', '#fdf7f2'] as const,
    glassTint: 'rgba(255,255,255,0.55)',
    overlay: 'rgba(0,0,0,0.04)',
  },
  dark: {
    primary: ['#ff8a3d', '#ff5400'] as const,
    primarySoft: ['rgba(255,112,0,0.22)', 'rgba(255,112,0,0.12)'] as const,
    surface: ['#241e1a', '#1d1815'] as const,
    glassTint: 'rgba(36,30,26,0.65)',
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
    primaryContrast: '#ffffff',
    primarySoft: '#fff1e3',
    background: '#fdf7f2',
    surface: '#ffffff',
    surfaceMuted: '#f3f4f6',
    surfaceElevated: '#ffffff',
    text: '#11181C',
    textMuted: '#687076',
    textSubtle: '#9BA1A6',
    border: '#f3e8df',
    borderMuted: '#f3f4f6',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    skeleton: '#eeeeee',
    overlay: 'rgba(0,0,0,0.4)',
    shadow: '#ff7000',
    inputBg: '#f9fafb',
    badgeBg: '#ff7000',
    badgeContrast: '#ffffff',
    tabBarBg: '#ffffff',
    tabBarBorder: '#ffffff',
    tint: PRIMARY,
    tabIconDefault: '#9BA1A6',
    tabIconSelected: PRIMARY,
    secondary: '#fdf7f2',
    backgroundSecondary: '#fdf7f2',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    primary: PRIMARY,
    primaryContrast: '#180a00',
    primarySoft: 'rgba(255,112,0,0.18)',
    background: '#13100d',
    surface: '#1d1815',
    surfaceMuted: '#262120',
    surfaceElevated: '#221c19',
    text: '#f5ede5',
    textMuted: '#a8a09a',
    textSubtle: '#7a726c',
    border: '#2a2421',
    borderMuted: '#231e1c',
    danger: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    skeleton: '#2a2421',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#000000',
    inputBg: '#1d1815',
    badgeBg: '#ff7000',
    badgeContrast: '#ffffff',
    tabBarBg: '#1d1815',
    tabBarBorder: '#2a2421',
    tint: '#ffffff',
    tabIconDefault: '#7a726c',
    tabIconSelected: PRIMARY,
    secondary: '#1d1815',
    backgroundSecondary: '#13100d',
  },
};

export type Theme = typeof palettes.light;

export default {
  light: palettes.light,
  dark: palettes.dark,
};
