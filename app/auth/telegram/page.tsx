'use client';

import React, { useEffect, useRef, useState } from 'react';

const BOT_USERNAME = 'PizzaPayNext_bot';

export default function TelegramAuthPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/';

    (window as any).onTelegramAuth = async (user: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      auth_date: number;
      hash: string;
    }) => {
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Ошибка входа');
          return;
        }

        const loginUrl = `${redirect}?email=${encodeURIComponent(data.email)}&password=${encodeURIComponent(String(user.id))}`;
        window.location.href = loginUrl;
      } catch {
        setError('Ошибка входа через Telegram');
      }
    };

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
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      background: '#0a0a0a',
      color: '#fff',
      padding: 20,
    }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Вход через Telegram</h1>
      <p style={{ color: '#888', marginBottom: 32 }}>Нажмите на кнопку ниже для входа</p>
      <div ref={containerRef} />
      {error && <p style={{ color: '#ff4444', marginTop: 16 }}>{error}</p>}
    </div>
  );
}
