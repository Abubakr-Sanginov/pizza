'use client';

import { Button } from '@/shared/components/ui';
import { signIn } from 'next-auth/react';
import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  className?: string;
}

const BOT_USERNAME = 'PizzaPayNext_bot';

export const TelegramLoginButton: React.FC<Props> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  const handleTelegramAuth = async (user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Ошибка входа через Telegram');
        setLoading(false);
        return;
      }

      await signIn('credentials', {
        email: data.email,
        password: user.id.toString(),
        callbackUrl: '/',
        redirect: true,
      });
    } catch {
      toast.error('Ошибка входа через Telegram');
      setLoading(false);
    }
  };

  const loadWidget = () => {
    if (widgetLoaded) return;

    (window as any).onTelegramAuth = handleTelegramAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-userpic', 'true');

    if (containerRef.current) {
      containerRef.current.appendChild(script);
      setWidgetLoaded(true);
    }
  };

  return (
    <div className={className}>
      {!widgetLoaded ? (
        <Button
          variant="secondary"
          type="button"
          className="gap-2 h-12 p-2 flex-1 bg-[#2AABEE] hover:bg-[#229ED9] text-white"
          onClick={loadWidget}
          disabled={loading}>
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.65-2.89 7.99-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
            </svg>
          )}
          Telegram
        </Button>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center min-h-[48px]"
        />
      )}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          Вход через Telegram...
        </div>
      )}
    </div>
  );
};
