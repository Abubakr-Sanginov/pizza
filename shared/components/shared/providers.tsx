'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import i18n, { SUPPORTED_LANGUAGES, LANG_STORAGE_KEY } from '@/shared/lib/i18n';
import { NotificationsManager } from './notifications-manager';
import { ThemeProvider } from './theme-provider';

const I18nBootstrap: React.FC = () => {
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LANG_STORAGE_KEY);
      if (saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved) && saved !== i18n.language) {
        i18n.changeLanguage(saved);
      }
    } catch {}

    const onChange = (lng: string) => {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lng);
      } catch {}
    };
    i18n.on('languageChanged', onChange);
    return () => {
      i18n.off('languageChanged', onChange);
    };
  }, []);
  return null;
};

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider>
      <I18nBootstrap />
      <SessionProvider>{children}</SessionProvider>
      <Toaster
        toastOptions={{
          className: '!bg-card !text-card-foreground !border !border-border',
        }}
      />
      <NextTopLoader />
      <NotificationsManager />
    </ThemeProvider>
  );
};
