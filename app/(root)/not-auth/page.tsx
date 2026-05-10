'use client';

import React from 'react';
import { LoginForm } from '@/shared/components/shared/modals/auth-modal/forms/login-form';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center mt-20 px-4">
      <div className="w-full max-w-[450px] bg-card text-card-foreground p-10 rounded-2xl border border-border shadow-sm transition-all hover:shadow-md">
        <LoginForm />

        <div className="mt-8 pt-8 border-t border-border">
          <Link href="/">
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft size={18} />
              Вернуться на главную
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
