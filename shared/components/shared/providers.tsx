'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { MotionConfig } from 'framer-motion';
import NextTopLoader from 'nextjs-toploader';
import i18n from '@/shared/lib/i18n';
import { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES } from '@/shared/lib/i18n';
import { detectDevicePerformance } from '@/shared/lib/device-performance';
import { NotificationsManager } from './notifications-manager';
import { ThemeProvider } from './theme-provider';
import { ReferralCapture } from './referral-capture';

const I18nBootstrap: React.FC = () => {
  React.useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(LANG_STORAGE_KEY); } catch {}
    const lang = saved && (SUPPORTED_LANGUAGES as readonly string[]).includes(saved) ? saved : 'ru';
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    // держим cookie в синхроне, чтобы серверные компоненты видели тот же язык
    try { document.cookie = `${LANG_STORAGE_KEY}=${lang}; path=/; max-age=31536000`; } catch {}
  }, []);
  return null;
};

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  // Слабые устройства: меньше анимаций и без дорогого backdrop-blur (см. globals.css)
  const [lowEnd, setLowEnd] = React.useState(false);

  React.useEffect(() => {
    if (detectDevicePerformance() === 'low') {
      setLowEnd(true);
      try { document.documentElement.classList.add('perf-low'); } catch {}
    }
  }, []);

  return (
    <MotionConfig reducedMotion={lowEnd ? 'always' : 'user'}>
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
    </MotionConfig>
  );
};
