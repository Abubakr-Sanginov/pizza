'use client';

import { Button } from '@/shared/components/ui';
import { signIn } from 'next-auth/react';
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  className?: string;
}

export const TelegramLoginButton: React.FC<Props> = ({ className }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/telegram/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.botUrl) {
        toast.error('Ошибка запуска входа через Telegram');
        setLoading(false);
        return;
      }

      window.open(data.webUrl || data.botUrl, '_blank');

      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const pollRes = await fetch(`/api/auth/telegram/poll?token=${data.token}`);
          const pollData = await pollRes.json();
          if (pollData.confirmed && pollData.id) {
            await signIn('credentials', {
              email: pollData.email,
              password: String(pollData.telegramId),
              callbackUrl: '/',
              redirect: true,
            });
            return;
          }
        } catch {}
      }
      toast.error('Время ожидания истекло. Попробуйте снова.');
    } catch {
      toast.error('Ошибка входа через Telegram');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="secondary"
      type="button"
      className={`gap-2 h-12 p-2 flex-1 bg-[#2AABEE] hover:bg-[#229ED9] text-white ${className || ''}`}
      onClick={handleClick}
      disabled={loading}>
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin" />
      ) : (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.88.03-.24.37-.49 1.02-.75 3.99-1.74 6.65-2.89 7.99-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
        </svg>
      )}
      {loading ? 'Подтвердите в Telegram...' : 'Telegram'}
    </Button>
  );
};
