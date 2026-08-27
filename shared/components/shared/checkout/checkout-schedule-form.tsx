'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Clock } from 'lucide-react';
import { WhiteBlock } from '../white-block';
import { Title } from '../title';
import { cn } from '@/shared/lib/utils';

function generateTimeSlots() {
  const slots: { label: string; value: string }[] = [];
  const now = new Date();
  const start = new Date(now.getTime() + 40 * 60 * 1000);
  const roundedMinutes = start.getMinutes() >= 30 ? 60 : 30;
  start.setMinutes(roundedMinutes, 0, 0);
  const end = new Date(now);
  end.setHours(23, 30, 0, 0);
  if (start > end) return slots;
  let cur = new Date(start);
  while (cur <= end) {
    const h = String(cur.getHours()).padStart(2, '0');
    const m = String(cur.getMinutes()).padStart(2, '0');
    slots.push({ label: h + ':' + m, value: h + ':' + m });
    cur = new Date(cur.getTime() + 30 * 60 * 1000);
  }
  return slots;
}

interface Props { className?: string; }

export const CheckoutScheduleForm: React.FC<Props> = ({ className }) => {
  const form = useFormContext();
  const scheduled: string = form?.watch?.('scheduledAt') ?? '';
  const slots = React.useMemo(() => generateTimeSlots(), []);
  return (
    <WhiteBlock className={cn('p-6', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="text-primary" size={20} />
        <Title text="Время доставки" size="sm" className="font-bold" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => form?.setValue?.('scheduledAt', '')}
          className={cn(
            'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
            !scheduled
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-secondary text-foreground hover:border-primary/50',
          )}
        >
          Как можно скорее (~40 мин)
        </button>
        {slots.map((slot) => (
          <button
            key={slot.value}
            type="button"
            onClick={() => form?.setValue?.('scheduledAt', slot.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
              scheduled === slot.value
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-secondary text-foreground hover:border-primary/50',
            )}
          >
            {slot.label}
          </button>
        ))}
      </div>
      {scheduled && (
        <p className="mt-3 text-sm text-muted-foreground">
          Заказ будет доставлен к <strong>{scheduled}</strong>
        </p>
      )}
    </WhiteBlock>
  );
};
