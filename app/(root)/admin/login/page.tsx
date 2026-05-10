'use client';

import React from 'react';
import { LoginForm } from '@/shared/components/shared/modals/auth-modal/forms/login-form';
import { Container, Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function AdminLoginPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="flex items-center justify-center h-screen">Загрузка...</div>;
  }

  // Если уже залогинен и админ - кидаем в дашборд
  if (session?.user.role === 'ADMIN') {
    return redirect('/dashboard');
  }

  return (
    <Container className="flex items-center justify-center min-h-[calc(100vh-100px)] py-20">
      <div className="w-full max-w-[450px] bg-card text-card-foreground p-10 rounded-3xl border border-border shadow-2xl">
        <div className="text-center mb-8">
           <Title text="Вход в админ-панель" size="lg" className="font-bold mb-2" />
           <p className="text-muted-foreground">Для доступа к управлению необходимо авторизоваться под учетной записью администратора</p>
        </div>

        <LoginForm onClose={() => window.location.href = '/dashboard'} />

        <div className="mt-8 pt-8 border-t border-border text-center">
          <Link href="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-primary gap-2">
              <ArrowLeft size={16} />
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
