import { useEffect } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { palettes, Theme } from '@/constants/Colors';

const STORAGE_KEY = 'themePreference';

type ThemePreference = 'light' | 'dark' | 'system';

interface ThemePrefState {
  preference: ThemePreference;
  hydrated: boolean;
  setPreference: (next: ThemePreference) => void;
  toggle: (currentResolved: 'light' | 'dark') => void;
}

export const useThemePreference = create<ThemePrefState>((set) => ({
  preference: 'dark',
  hydrated: false,
  setPreference: (next) => {
    set({ preference: next });
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  },
  toggle: (currentResolved) => {
    const next: ThemePreference = currentResolved === 'dark' ? 'light' : 'dark';
    set({ preference: next });
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  },
}));

AsyncStorage.getItem(STORAGE_KEY)
  .then((stored) => {
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      useThemePreference.setState({ preference: stored, hydrated: true });
    } else {
      useThemePreference.setState({ preference: 'dark', hydrated: true });
    }
  })
  .catch(() => useThemePreference.setState({ preference: 'dark', hydrated: true }));

let cachedScheme: 'light' | 'dark' =
  Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';

const listener = Appearance.addChangeListener(({ colorScheme }) => {
  if (colorScheme === 'dark' || colorScheme === 'light') {
    cachedScheme = colorScheme;
  }
});

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const preference = useThemePreference((s) => s.preference);

  const systemResolved: 'light' | 'dark' =
    scheme === 'dark' ? 'dark' : scheme === 'light' ? 'light' : cachedScheme;
  if (systemResolved !== cachedScheme) cachedScheme = systemResolved;

  const resolved: 'light' | 'dark' =
    preference === 'system' ? systemResolved : preference;

  return resolved === 'dark' ? palettes.dark : palettes.light;
}

export type { Theme, ThemePreference };

export const __cleanup = () => listener.remove();
