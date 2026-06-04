'use client';

import React from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useFormContext } from 'react-hook-form';

import { WhiteBlock } from './white-block';
import { CheckoutItemDetails } from './checkout-item-details';
import { ArrowRight, Check, Package, Percent, Ticket, Truck, X } from 'lucide-react';
import { Button, Input, Skeleton } from '../ui';
import { cn } from '@/shared/lib/utils';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/shared/hooks';
import { PaymentMethodSelector } from './payment-method-selector';

interface Props {
  totalAmount: number;
  vatPrice?: number;
  deliveryPrice?: number;
  loading?: boolean;
  className?: string;
}

export const CheckoutSidebar: React.FC<Props> = ({
  totalAmount,
  loading,
  className,
  vatPrice: vatPercent = 15,
  deliveryPrice = 250,
}) => {
  const { t } = useTranslation();
  const form = useFormContext();
  const { items } = useCart();

  const [promoInput, setPromoInput] = React.useState('');
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [applying, setApplying] = React.useState(false);

  const vatPrice = (totalAmount * vatPercent) / 100;
  const discount = appliedPromo?.discount ?? 0;
  const totalPrice = Math.max(0, totalAmount + deliveryPrice + vatPrice - discount);

  const itemsKey = items.map((i) => `${i.productId}:${i.quantity}:${i.price}`).join('|');
  React.useEffect(() => {
    if (!appliedPromo) return;
    let cancelled = false;
    axios
      .post('/api/promo/validate', {
        code: appliedPromo.code,
        subtotal: totalAmount,
        items: items.map((i) => ({ productId: i.productId, lineTotal: i.price * i.quantity })),
      })
      .then(({ data }) => {
        if (cancelled) return;
        setAppliedPromo({ code: data.code, discount: data.appliedDiscount });
      })
      .catch(() => {
        if (cancelled) return;
        // Promo no longer valid for new cart (e.g., scoped items removed)
        setAppliedPromo(null);
        form?.setValue?.('promoCode', undefined);
        toast.error('Промокод больше не действует для текущей корзины');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, totalAmount]);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setApplying(true);
    try {
      const { data } = await axios.post('/api/promo/validate', {
        code: promoInput.trim(),
        subtotal: totalAmount,
        items: items.map((i) => ({ productId: i.productId, lineTotal: i.price * i.quantity })),
      });
      setAppliedPromo({ code: data.code, discount: data.appliedDiscount });
      form?.setValue?.('promoCode', data.code);
      toast.success(`Промокод применён: −${data.appliedDiscount} TJS`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Не удалось применить промокод');
    } finally {
      setApplying(false);
    }
  };

  const clearPromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    form?.setValue?.('promoCode', undefined);
  };

  return (
    <WhiteBlock className={cn('p-6 sticky top-4', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-xl">{t('checkout.total')}</span>
        {loading ? (
          <Skeleton className="h-11 w-48" />
        ) : (
          <span className="h-11 text-[34px] font-extrabold">{totalPrice} TJS</span>
        )}
      </div>

      <CheckoutItemDetails
        title={
          <div className="flex items-center">
            <Package size={18} className="mr-2 text-muted-foreground" />
            {t('checkout.cartPrice')}
          </div>
        }
        value={loading ? <Skeleton className="h-6 w-16 rounded-[6px]" /> : `${totalAmount} TJS`}
      />
      <CheckoutItemDetails
        title={
          <div className="flex items-center">
            <Percent size={18} className="mr-2 text-muted-foreground" />
            {t('checkout.vat')}
          </div>
        }
        value={loading ? <Skeleton className="h-6 w-16 rounded-[6px]" /> : `${vatPrice} TJS`}
      />
      <CheckoutItemDetails
        title={
          <div className="flex items-center">
            <Truck size={18} className="mr-2 text-muted-foreground" />
            {t('checkout.delivery')}
          </div>
        }
        value={loading ? <Skeleton className="h-6 w-16 rounded-[6px]" /> : `${deliveryPrice} TJS`}
      />

      {appliedPromo && (
        <CheckoutItemDetails
          title={
            <div className="flex items-center text-primary font-semibold">
              <Ticket size={18} className="mr-2" />
              {appliedPromo.code}
            </div>
          }
          value={
            <span className="text-primary font-bold">−{appliedPromo.discount} TJS</span>
          }
        />
      )}

      {/* Promo input */}
      <div className="mt-5">
        {appliedPromo ? (
          <button
            type="button"
            onClick={clearPromo}
            className="w-full h-10 inline-flex items-center justify-between gap-2 px-4 rounded-xl glass text-sm font-bold text-foreground hover:bg-muted transition">
            <span className="flex items-center gap-2">
              <Check size={16} className="text-primary" />
              Промокод применён
            </span>
            <X size={14} className="text-muted-foreground" />
          </button>
        ) : (
          <div className="flex gap-2">
            <Input
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
              placeholder="Промокод"
              className="h-10 uppercase tracking-wider font-bold"
              maxLength={50}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyPromo}
              loading={applying}
              disabled={!promoInput.trim() || loading}
              className="h-10 rounded-xl font-bold">
              ОК
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="text-sm font-bold mb-2 text-muted-foreground">Способ оплаты</div>
        <PaymentMethodSelector />
      </div>

      <Button
        loading={loading}
        type="submit"
        className="w-full h-14 rounded-2xl mt-6 text-base font-bold">
        {t('checkout.toPayment')}
        <ArrowRight className="w-5 ml-2" />
      </Button>
    </WhiteBlock>
  );
};
