'use client';

import React from 'react';

type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ResolvedTheme;
}

const ThemeContext = React.createContext<ThemeContextValue>({ theme: 'light' });

export const useTheme = () => React.useContext(ThemeContext);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = React.useState<ResolvedTheme>(() => {
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (isDark: boolean) => {
      const root = document.documentElement;
      root.classList.toggle('dark', isDark);
      root.style.colorScheme = isDark ? 'dark' : 'light';
      setTheme(isDark ? 'dark' : 'light');
    };

    apply(mql.matches);
    const listener = (e: MediaQueryListEvent) => apply(e.matches);
    mql.addEventListener?.('change', listener);
    return () => mql.removeEventListener?.('change', listener);
  }, []);

  return <ThemeContext.Provider value={{ theme }}>{children}</ThemeContext.Provider>;
};

export const themeInitScript = `
(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=document.documentElement;if(d){r.classList.add('dark');r.style.colorScheme='dark';}else{r.style.colorScheme='light';}}catch(e){}})();
`;
