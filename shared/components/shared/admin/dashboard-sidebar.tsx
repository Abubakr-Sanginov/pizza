'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { LayoutDashboard, ShoppingBasket, FolderTree, Beef, ArrowLeft, Images, MapPin, Package, MessageSquare, Settings, Bike, Bell, Ticket, Warehouse } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslation } from 'react-i18next';

interface Props {
  className?: string;
}

const adminItems = [
  { title: 'admin.nav.home', icon: LayoutDashboard, href: '/dashboard' },
  { title: 'admin.nav.orders', icon: Package, href: '/dashboard/orders' },
  { title: 'admin.nav.products', icon: ShoppingBasket, href: '/dashboard/products' },
  { title: 'admin.nav.warehouses', icon: Warehouse, href: '/dashboard/warehouses' },
  { title: 'admin.nav.categories', icon: FolderTree, href: '/dashboard/categories' },
  { title: 'admin.nav.ingredients', icon: Beef, href: '/dashboard/ingredients' },
  { title: 'admin.nav.promo', icon: Ticket, href: '/dashboard/promo' },
  { title: 'admin.nav.notifications', icon: Bell, href: '/dashboard/notifications' },
  { title: 'admin.nav.stores', icon: MapPin, href: '/dashboard/stores' },
  { title: 'admin.nav.stories', icon: Images, href: '/dashboard/stories' },
  { title: 'admin.nav.reviews', icon: MessageSquare, href: '/dashboard/reviews' },
  { title: 'admin.nav.users', icon: FolderTree, href: '/dashboard/users' },
  { title: 'admin.nav.settings', icon: Settings, href: '/dashboard/settings' },
];

const courierItems = [
  { title: 'admin.nav.myDeliveries', icon: Bike, href: '/dashboard/courier' },
];

export const DashboardSidebar: React.FC<Props> = ({ className }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const isCourier = session?.user?.role === 'COURIER';
  const isAdmin = session?.user?.role === 'ADMIN';

  const items = isCourier ? courierItems : adminItems;

  return (
    <div className={cn('flex flex-col w-64 bg-card text-card-foreground border-r border-border h-screen sticky top-0 p-5', className)}>
      <div className="flex items-center gap-3 mb-10 px-2">
        <img src="/logo.png" alt="Logo" width={30} height={30} />
        <span className="text-xl font-bold">{isCourier ? t('admin.common.courier') : t('admin.common.panel')}</span>
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
              <span className="font-medium">{t(item.title)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-5 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">{t('admin.common.backToSite')}</span>
        </Link>
      </div>
    </div>
  );
};
