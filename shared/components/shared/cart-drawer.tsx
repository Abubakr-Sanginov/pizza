'use client';

import React from 'react';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import Link from 'next/link';
import { Button } from '../ui';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CartDrawerItem } from './cart-drawer-item';
import { CartCrossSell } from './cart-cross-sell';
import { getCartItemDetails } from '@/shared/lib';
import { PizzaSize, PizzaType } from '@/shared/constants/pizza';
import { Title } from './title';
import { cn } from '@/shared/lib/utils';
import { useCart } from '@/shared/hooks';

export const CartDrawer: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { totalAmount, updateItemQuantity, items, removeCartItem } = useCart();
  const [redirecting, setRedirecting] = React.useState(false);
  const { t } = useTranslation();

  const onClickCountButton = React.useCallback((id: number, quantity: number, type: 'plus' | 'minus') => {
    const newQuantity = type === 'plus' ? quantity + 1 : quantity - 1;
    updateItemQuantity(id, newQuantity);
  }, [updateItemQuantity]);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>

      <SheetContent className="flex flex-col justify-between pb-0 glass-strong border-l border-border/50 ambient-bg">
        <div className={cn('flex flex-col h-full', !totalAmount && 'justify-center')}>
          {totalAmount > 0 && (
            <SheetHeader className="pb-2">
              <SheetTitle className="text-2xl font-black tracking-tight">
                В корзине{' '}
                <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                  {items.length} {t('cart.itemsCount')}
                </span>
              </SheetTitle>
            </SheetHeader>
          )}

          {!totalAmount && (
            <div className="flex flex-col items-center justify-center w-80 mx-auto">
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-primary/20 to-orange-500/10 ring-4 ring-primary/20 flex items-center justify-center shadow-soft-lg">
                  <ShoppingBag className="w-12 h-12 text-primary" strokeWidth={2} />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-500 text-white flex items-center justify-center font-black text-sm shadow-soft animate-pulse">
                  0
                </div>
              </div>
              <Title
                size="sm"
                text={t('cart.emptyTitle')}
                className="text-center font-black mb-2 tracking-tight"
              />
              <p className="text-center text-muted-foreground mb-8 leading-relaxed">
                {t('cart.emptyText')}
              </p>

              <SheetClose asChild>
                <Button
                  className="w-56 h-12 text-base font-extrabold rounded-2xl btn-gradient border-0"
                  size="lg">
                  <ArrowLeft className="w-5 mr-3" />
                  {t('cart.back')}
                </Button>
              </SheetClose>
            </div>
          )}

          {totalAmount > 0 && (
            <>
              <div className="-mx-6 mt-4 overflow-auto flex-1 px-2 scrollbar">
                {items.map((item) => (
                  <div key={item.id} className="mb-3">
                    <CartDrawerItem
                      id={item.id}
                      imageUrl={item.imageUrl}
                      details={getCartItemDetails(
                        item.ingredients,
                        item.pizzaType as PizzaType,
                        item.pizzaSize as PizzaSize,
                        t,
                      )}
                      disabled={item.disabled}
                      name={item.name}
                      price={item.price}
                      quantity={item.quantity}
                      onClickCountButton={onClickCountButton}
                      onClickRemove={removeCartItem}
                    />
                  </div>
                ))}
              </div>

              <div className="-mx-6 py-4 border-t border-border/40">
                <CartCrossSell />
              </div>

              <SheetFooter className="-mx-6 glass-strong border-t border-border/50 p-7">
                <div className="w-full">
                  <div className="flex items-baseline mb-5">
                    <span className="flex items-baseline flex-1 text-base text-muted-foreground font-medium">
                      {t('cart.total')}
                      <div className="flex-1 border-b border-dashed border-border/60 relative -top-1 mx-3" />
                    </span>

                    <span className="font-black text-2xl tracking-tight">
                      {totalAmount}{' '}
                      <span className="text-base text-muted-foreground font-bold">TJS</span>
                    </span>
                  </div>

                  <Link href="/checkout">
                    <Button
                      onClick={() => setRedirecting(true)}
                      loading={redirecting}
                      type="submit"
                      className="w-full h-14 text-base rounded-full btn-gradient border-0 font-extrabold uppercase tracking-wide">
                      Оформить за {totalAmount} TJS
                    </Button>
                  </Link>
                </div>
              </SheetFooter>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
