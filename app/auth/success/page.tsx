'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (redirect) {
      window.location.href = redirect;
    }
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
