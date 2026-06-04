'use client';

import React from 'react';

type ResolvedTheme = 'light' | 'dark';
type ThemePreference = ResolvedTheme | 'system';

const STORAGE_KEY = 'theme';

interface ThemeContextValue {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setTheme: (next: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'light',
  preference: 'system',
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => React.useContext(ThemeContext);

const getSystemTheme = (): ResolvedTheme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const applyToDocument = (resolved: ResolvedTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.style.colorScheme = resolved;
};

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [preference, setPreference] = React.useState<ThemePreference>('system');
  const [theme, setThemeState] = React.useState<ResolvedTheme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreference(stored);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const resolve = (): ResolvedTheme =>
      preference === 'system' ? (mql.matches ? 'dark' : 'light') : preference;

    const resolved = resolve();
    applyToDocument(resolved);
    setThemeState(resolved);

    if (preference !== 'system') return;
    const listener = (e: MediaQueryListEvent) => {
      const next: ResolvedTheme = e.matches ? 'dark' : 'light';
      applyToDocument(next);
      setThemeState(next);
    };
    mql.addEventListener?.('change', listener);
    return () => mql.removeEventListener?.('change', listener);
  }, [preference]);

  const setTheme = React.useCallback((next: ThemePreference) => {
    setPreference(next);
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleTheme = React.useCallback(() => {

    const current: ResolvedTheme =
      preference === 'system' ? getSystemTheme() : preference;
    setTheme(current === 'dark' ? 'light' : 'dark');
  }, [preference, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, preference, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const themeInitScript = `
(function(){try{var s=localStorage.getItem('${STORAGE_KEY}');var d;if(s==='dark'){d=true;}else if(s==='light'){d=false;}else{d=window.matchMedia('(prefers-color-scheme: dark)').matches;}var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.style.colorScheme='light';}}catch(e){}})();
`;
