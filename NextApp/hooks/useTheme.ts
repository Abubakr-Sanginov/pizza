import { Appearance, useColorScheme } from 'react-native';

import { palettes, Theme } from '@/constants/Colors';

let cachedScheme: 'light' | 'dark' = (Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

const listener = Appearance.addChangeListener(({ colorScheme }) => {
  if (colorScheme === 'dark' || colorScheme === 'light') {
    cachedScheme = colorScheme;
  }
});

export function useTheme(): Theme {
  const scheme = useColorScheme();
  const resolved: 'light' | 'dark' =
    scheme === 'dark' ? 'dark' : scheme === 'light' ? 'light' : cachedScheme;
  if (resolved !== cachedScheme) cachedScheme = resolved;
  return resolved === 'dark' ? palettes.dark : palettes.light;
}

export type { Theme };

export const __cleanup = () => listener.remove();
