const PRIMARY = '#3f52d9';
const PRIMARY_DARK = '#3043c4';

type ThemeMode = 'light' | 'dark';

export const gradients = {
  light: {
    primary: ['#5d70ed', '#3449d2'] as const,
    primarySoft: ['#eef0ff', '#dfe4ff'] as const,
    surface: ['#ffffff', '#f1f3ff'] as const,
    glassTint: 'rgba(255,255,255,0.55)',
    overlay: 'rgba(0,0,0,0.04)',
  },
  dark: {
    primary: ['#5869e8', '#3549d0'] as const,
    primarySoft: ['rgba(73,91,218,0.28)', 'rgba(40,52,145,0.16)'] as const,
    surface: ['#111318', '#090b0f'] as const,
    glassTint: 'rgba(18,20,26,0.72)',
    overlay: 'rgba(0,0,0,0.42)',
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
    primarySoft: '#eef0ff',
    background: '#f3f5fb',
    surface: '#ffffff',
    surfaceMuted: '#e9ecf5',
    surfaceElevated: '#ffffff',
    text: '#151922',
    textMuted: '#6d7382',
    textSubtle: '#a0a5b1',
    border: '#e3e6ef',
    borderMuted: '#edf0f6',
    danger: '#ef4444',
    success: '#22c55e',
    successSoft: '#dcfce7',
    warning: '#f59e0b',
    skeleton: '#e8dece',
    overlay: 'rgba(0,0,0,0.4)',
    shadow: '#3043c4',
    inputBg: '#ffffff',
    badgeBg: '#151922',
    badgeContrast: '#ffffff',
    tabBarBg: '#ffffff',
    tabBarBorder: '#e3e6ef',
    tint: PRIMARY,
    tabIconDefault: '#9b8f81',
    tabIconSelected: PRIMARY,
    secondary: '#ffffff',
    backgroundSecondary: '#e9ecf5',
  },
  dark: {
    mode: 'dark' as ThemeMode,
    primary: PRIMARY,
    primaryContrast: '#ffffff',
    primarySoft: 'rgba(63,82,217,0.2)',
    background: '#12151b',
    surface: '#080a0f',
    surfaceMuted: '#1b1f28',
    surfaceElevated: '#20242d',
    text: '#f7f8fb',
    textMuted: '#a5aab7',
    textSubtle: '#686e7c',
    border: '#262b35',
    borderMuted: '#1e232d',
    danger: '#f87171',
    success: '#4ade80',
    successSoft: 'rgba(74,222,128,0.15)',
    warning: '#fbbf24',
    skeleton: '#2b2621',
    overlay: 'rgba(0,0,0,0.7)',
    shadow: '#000000',
    inputBg: '#151820',
    badgeBg: '#3f52d9',
    badgeContrast: '#ffffff',
    tabBarBg: '#0b0d12',
    tabBarBorder: '#20242d',
    tint: '#ffffff',
    tabIconDefault: '#686e7c',
    tabIconSelected: PRIMARY,
    secondary: '#151820',
    backgroundSecondary: '#1b1f28',
  },
};

export type Theme = typeof palettes.light;

export default {
  light: palettes.light,
  dark: palettes.dark,
};
