'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import NextTopLoader from 'nextjs-toploader';
import i18n from '@/shared/lib/i18n';
import { NotificationsManager } from './notifications-manager';
import { ThemeProvider } from './theme-provider';
import { ReferralCapture } from './referral-capture';

const I18nBootstrap: React.FC = () => {
  React.useEffect(() => {
    if (i18n.language !== 'ru') {
      i18n.changeLanguage('ru');
    }
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
      <React.Suspense fallback={null}>
        <ReferralCapture />
      </React.Suspense>
    </ThemeProvider>
  );
};
