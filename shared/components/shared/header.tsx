'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Container } from './container';
import Image from 'next/image';
import Link from 'next/link';
import { SearchInput } from './search-input';
import { CartButton } from './cart-button';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProfileButton } from './profile-button';
import { AuthModal } from './modals';

interface Props {
  hasSearch?: boolean;
  hasCart?: boolean;
  className?: string;
}

export const Header: React.FC<Props> = ({ hasSearch = true, hasCart = true, className }) => {
  const router = useRouter();
  const [openAuthModal, setOpenAuthModal] = React.useState(false);

  const searchParams = useSearchParams();

  React.useEffect(() => {
    let toastMessage = '';

    if (searchParams.has('paid')) {
      toastMessage = 'Заказ успешно оплачен! Информация отправлена на почту.';
    }

    if (searchParams.has('verified')) {
      toastMessage = 'Почта успешно подтверждена!';
    }

    if (toastMessage) {
      setTimeout(() => {
        router.replace('/');
        toast.success(toastMessage, {
          duration: 3000,
        });
      }, 1000);
    }
  }, []);

  return (
    <header className={cn('border-b', className)}>
      <Container className="py-4 md:py-8">
        <div className="flex items-center justify-between gap-2">
          {/* Левая часть */}
          <Link href="/">
            <div className="flex items-center gap-2 md:gap-4">
              <Image src="/logo.png" alt="Logo" width={35} height={35} />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-2xl uppercase font-black leading-none">Next Pizza</h1>
                <p className="text-[10px] md:text-sm text-gray-400 leading-3 hidden md:block mt-1">
                  вкусней уже некуда
                </p>
              </div>
            </div>
          </Link>

          {/* Поиск на десктопе */}
          {hasSearch && (
            <div className="mx-2 md:mx-10 flex-1 hidden md:block">
              <SearchInput />
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center gap-1 md:gap-3">
            <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

            <ProfileButton onClickSignIn={() => setOpenAuthModal(true)} />

            {hasCart && <CartButton className="min-w-[50px] px-2 md:px-5" />}
          </div>
        </div>

        {/* Поиск на мобилке (второй ряд) */}
        {hasSearch && (
          <div className="mt-4 md:hidden">
            <SearchInput />
          </div>
        )}
      </Container>
    </header>
  );
};
