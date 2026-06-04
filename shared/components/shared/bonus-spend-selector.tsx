'use client';

import React from 'react';
import axios from 'axios';
import { useFormContext } from 'react-hook-form';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Props {
  baseTotal: number;
  className?: string;
}

export const BonusSpendSelector: React.FC<Props> = ({ baseTotal, className }) => {
  const form = useFormContext();
  const value: number = form?.watch?.('bonusToSpend') ?? 0;
  const [balance, setBalance] = React.useState<number | null>(null);
  const [level, setLevel] = React.useState<string>('BRONZE');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    axios
      .get('/api/bonus/me')
      .then(({ data }) => {
        setBalance(data.balance);
        setLevel(data.level);
      })
      .catch(() => setBalance(0))
      .finally(() => setLoading(false));
  }, []);

  if (loading || balance === null || balance === 0) return null;

  const maxAllowed = Math.min(balance, Math.floor(baseTotal * 0.5));

  return (
    <div
      className={cn(
        'rounded-xl p-3 border-2 border-amber-200 dark:border-amber-900 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Sparkles size={16} className="text-amber-600" />
          Бонусы ({level})
        </div>
        <div className="text-amber-700 dark:text-amber-300 font-extrabold">
          {balance} ⭐
        </div>
      </div>

      {value > 0 ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-zinc-800/60">
          <span className="text-sm font-bold">
            Спишется <span className="text-amber-700 dark:text-amber-300">−{value} TJS</span>
          </span>
          <button
            type="button"
            onClick={() => form?.setValue?.('bonusToSpend', 0)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => form?.setValue?.('bonusToSpend', maxAllowed)}
            disabled={maxAllowed === 0}
            className="flex-1 text-xs font-bold px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            Списать {maxAllowed} (до 50% заказа)
          </button>
        </div>
      )}

      <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1.5 leading-snug">
        За каждый заказ начисляем 5% бонусами. 1 бонус = 1 TJS.
      </p>
    </div>
  );
};
