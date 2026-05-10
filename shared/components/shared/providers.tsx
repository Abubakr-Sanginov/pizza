'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import '@/shared/lib/i18n';
import { NotificationsManager } from './notifications-manager';
import { ThemeProvider } from './theme-provider';

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <ThemeProvider>
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
