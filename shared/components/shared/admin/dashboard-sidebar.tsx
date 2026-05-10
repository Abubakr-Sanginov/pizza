'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { LayoutDashboard, ShoppingBasket, FolderTree, Beef, ArrowLeft, Images, MapPin, Package, MessageSquare, Settings, Bike, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Props {
  className?: string;
}

const adminItems = [
  { title: 'Главная', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'Заказы', icon: Package, href: '/dashboard/orders' },
  { title: 'Продукты', icon: ShoppingBasket, href: '/dashboard/products' },
  { title: 'Категории', icon: FolderTree, href: '/dashboard/categories' },
  { title: 'Ингредиенты', icon: Beef, href: '/dashboard/ingredients' },
  { title: 'Уведомления', icon: Bell, href: '/dashboard/notifications' },
  { title: 'Рестораны', icon: MapPin, href: '/dashboard/stores' },
  { title: 'Сториз', icon: Images, href: '/dashboard/stories' },
  { title: 'Отзывы', icon: MessageSquare, href: '/dashboard/reviews' },
  { title: 'Пользователи', icon: FolderTree, href: '/dashboard/users' },
  { title: 'Настройки', icon: Settings, href: '/dashboard/settings' },
];

const courierItems = [
  { title: 'Мои доставки', icon: Bike, href: '/dashboard/courier' },
];

export const DashboardSidebar: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isCourier = session?.user?.role === 'COURIER';
  const isAdmin = session?.user?.role === 'ADMIN';

  const items = isCourier ? courierItems : adminItems;

  return (
    <div className={cn('flex flex-col w-64 bg-card text-card-foreground border-r border-border h-screen sticky top-0 p-5', className)}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <img src="/logo.png" alt="Logo" width={30} height={30} />
        <span className="text-xl font-bold">{isCourier ? 'Курьер' : 'Админка'}</span>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted',
              )}>
              <item.icon size={20} />
              <span className="font-medium">{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-5 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">На сайт</span>
        </Link>
      </div>
    </div>
  );
};
