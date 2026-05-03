import { useSession } from 'next-auth/react';
import React from 'react';
import { Button } from '../ui/button';
import { CircleUser, User, Package } from 'lucide-react';
import Link from 'next/link';

interface Props {
  onClickSignIn?: () => void;
  className?: string;
}

export const ProfileButton: React.FC<Props> = ({ className, onClickSignIn }) => {
  const { data: session } = useSession();

  return (
    <div className={className}>
      {!session ? (
        <Button onClick={onClickSignIn} variant="outline" className="flex items-center gap-1 px-2 md:px-4">
          <User size={16} />
          <span className="hidden md:inline">Войти</span>
        </Button>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/profile/orders">
            <Button variant="secondary" className="flex items-center gap-2 px-2 md:px-4">
              <span className="hidden md:inline">Заказы</span>
              <Package size={16} className="md:hidden" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="secondary" className="flex items-center gap-2 px-2 md:px-4">
              <CircleUser size={18} />
              <span className="hidden md:inline">Профиль</span>
            </Button>
          </Link>
          {session.user.role === 'COURIER' && (
            <Link href="/courier">
              <Button variant="secondary" className="flex items-center gap-2 px-2 md:px-4 border-orange-500 border text-orange-600 hover:bg-orange-50">
                <span className="hidden md:inline">Доставки</span>
                <Package size={16} className="md:hidden" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
