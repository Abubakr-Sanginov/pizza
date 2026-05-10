'use client';

import { cn } from '@/shared/lib/utils';
import React from 'react';
import { Button } from '../ui';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import { CartDrawer } from './cart-drawer';
import { useCartStore } from '@/shared/store';

interface Props {
  className?: string;
}

export const CartButton: React.FC<Props> = ({ className }) => {
  const [totalAmount, items, loading] = useCartStore((state) => [
    state.totalAmount,
    state.items,
    state.loading,
  ]);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartDrawer>
      <Button
        loading={loading}
        className={cn(
          'group relative btn-gradient rounded-2xl border-0 px-4 md:px-5 font-extrabold',
          { 'w-[105px]': loading },
          className,
        )}>
        <b className="hidden sm:block tracking-tight">{totalAmount} TJS</b>
        <span className="h-5 w-[1px] bg-white/40 mx-3 hidden sm:block" />
        <div className="flex items-center gap-1.5 transition-all duration-300 group-hover:translate-x-[-6px] group-hover:opacity-0">
          <ShoppingCart size={16} strokeWidth={2.5} />
          <b className="text-sm">{totalQuantity}</b>
        </div>
        <ArrowRight
          size={20}
          strokeWidth={2.5}
          className="absolute right-5 transition-all duration-300 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
        />
        {totalQuantity > 0 && !loading && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 rounded-full bg-white text-primary text-[11px] font-black flex items-center justify-center shadow-soft ring-2 ring-primary">
            {totalQuantity > 99 ? '99+' : totalQuantity}
          </span>
        )}
      </Button>
    </CartDrawer>
  );
};
