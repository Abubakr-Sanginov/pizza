'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Container } from './container';
import Image from 'next/image';
import Link from 'next/link';
import { SearchInput } from './search-input';
import { CartButton } from './cart-button';
import { Bell } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProfileButton } from './profile-button';
import { AuthModal } from './modals';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from '../ui';

const LanguageSelector = () => {
  const { i18n } = useTranslation();

  return (
    <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
      <SelectTrigger className="w-[60px] h-[38px] bg-gray-50 border-none shadow-none focus:ring-0">
        <SelectValue placeholder="Lang" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ru">RU</SelectItem>
        <SelectItem value="tg">TG</SelectItem>
        <SelectItem value="en">EN</SelectItem>
      </SelectContent>
    </Select>
  );
};

interface Props {
  hasSearch?: boolean;
  hasCart?: boolean;
  className?: string;
}

export const Header: React.FC<Props> = ({ hasSearch = true, hasCart = true, className }) => {
  const router = useRouter();
  const [openAuthModal, setOpenAuthModal] = React.useState(false);
  const { t } = useTranslation();

  const searchParams = useSearchParams();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    let toastMessage = '';

    if (searchParams.has('paid')) {
      toastMessage = t('header.paidSuccess'); // Added to locales below
    }

    if (searchParams.has('verified')) {
      toastMessage = t('header.verifiedSuccess'); // Added to locales below
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
                  {mounted && t('header.slogan')}
                </p>
              </div>
            </div>
          </Link>

          {/* Поиск на десктопе */}
          {hasSearch && (
            <div className="mx-2 md:mx-10 flex-1 hidden md:block">
              <SearchInput placeholder={t('header.searchPlaceholder')} />
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center gap-1 md:gap-3">
            <AuthModal open={openAuthModal} onClose={() => setOpenAuthModal(false)} />

            <LanguageSelector />

            <Link href="/notifications">
              <Button variant="secondary" className="px-2 md:px-4">
                <Bell size={20} className="text-gray-500" />
              </Button>
            </Link>

            <ProfileButton onClickSignIn={() => setOpenAuthModal(true)} />

            {hasCart && <CartButton className="min-w-[50px] px-2 md:px-5" />}
          </div>
        </div>

        {/* Поиск на мобилке (второй ряд) */}
        {hasSearch && (
          <div className="mt-4 md:hidden">
            <SearchInput placeholder={t('header.searchPlaceholder')} />
          </div>
        )}
      </Container>
    </header>
  );
};
