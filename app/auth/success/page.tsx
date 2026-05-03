'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();

        if (session?.user && redirect) {
          // Формируем URL с данными пользователя
          const url = new URL(redirect);
          url.searchParams.append('email', session.user.email || '');
          url.searchParams.append('name', session.user.name || '');
          url.searchParams.append('image', session.user.image || '');
          
          window.location.href = url.toString();
        } else if (redirect) {
          window.location.href = redirect;
        }
      } catch (error) {
        console.error('Redirect error:', error);
        if (redirect) window.location.href = redirect;
      }
    };

    checkSessionAndRedirect();
  }, [redirect]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm mx-4">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold mb-2">Вход выполнен!</h1>
      <p className="text-gray-500 mb-6">Возвращаемся в приложение...</p>
      <a 
        href={redirect || '/'} 
        className="inline-block bg-[#ff7000] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
      >
        Нажать, если не вернуло
      </a>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdf7f2]">
      <Suspense fallback={<div>Загрузка...</div>}>
        <AuthSuccessContent />
      </Suspense>
    </div>
  );
}
