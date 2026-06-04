'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertTriangle, Banknote, CreditCard, Send, Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type Method = 'CASH_ON_DELIVERY' | 'TELEGRAM_STARS' | 'MANUAL_TRANSFER' | 'ALIF_PAY';

const STARS_FEE_PERCENT = Number(process.env.NEXT_PUBLIC_STARS_FEE_PERCENT || '43');

const OPTIONS: Array<{ id: Method; title: string; subtitle: string; icon: React.ReactNode }> = [
  {
    id: 'CASH_ON_DELIVERY',
    title: 'Курьеру при получении',
    subtitle: 'Наличными или картой',
    icon: <Banknote size={20} />,
  },
  {
    id: 'ALIF_PAY',
    title: 'Алиф Pay (картой онлайн)',
    subtitle: 'Korti Milli, Visa, Mastercard, Alif Mobi',
    icon: <CreditCard size={20} />,
  },
  {
    id: 'TELEGRAM_STARS',
    title: 'Telegram Stars',
    subtitle: `Оплата звёздами в Telegram (+${STARS_FEE_PERCENT}% наценка)`,
    icon: <Star size={20} />,
  },
  {
    id: 'MANUAL_TRANSFER',
    title: 'Перевод на карту',
    subtitle: 'Через Telegram-бот, с подтверждением',
    icon: <Send size={20} />,
  },
];

export const PaymentMethodSelector: React.FC<{ className?: string }> = ({ className }) => {
  const form = useFormContext();
  const value: Method = form?.watch?.('paymentMethod') ?? 'CASH_ON_DELIVERY';

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            type="button"
            key={opt.id}
            onClick={() => form?.setValue?.('paymentMethod', opt.id, { shouldDirty: true })}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl border text-left transition',
              active
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {opt.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm">{opt.title}</div>
              <div className="text-xs text-muted-foreground">{opt.subtitle}</div>
            </div>
            <div
              className={cn(
                'w-5 h-5 rounded-full border-2',
                active ? 'border-primary bg-primary' : 'border-border',
              )}
            />
          </button>
        );
      })}

      {value === 'TELEGRAM_STARS' && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p>
              <b>Внимание:</b> Telegram удерживает <b>30%</b> комиссии с каждой оплаты звёздами.
              Чтобы мы получили полную стоимость заказа, к сумме добавляется <b>+{STARS_FEE_PERCENT}%</b>.
            </p>
            <p>
              <b>Почему +{STARS_FEE_PERCENT}%, а не +30%?</b> Если просто добавить 30%, после удержания
              Telegram’ом останется ≈91% от заказа — мы не покроем расходы. Формула:
              сумма ÷ (1 − 0,30) ≈ сумма × 1,43. Так после комиссии нам приходит ровно стоимость заказа.
            </p>
            <p>Хотите без переплаты — выберите <b>«Перевод на карту»</b> или <b>оплату курьеру</b>.</p>
          </div>
        </div>
      )}
    </div>
  );
};
