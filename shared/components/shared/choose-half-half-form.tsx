'use client';

import React from 'react';
import { ProductItem, Product } from '@prisma/client';
import { Title } from './title';
import { Button } from '../ui';
import { GroupVariants } from './group-variants';
import { PizzaSize, PizzaType, pizzaTypes } from '@/shared/constants/pizza';
import { getAvailablePizzaSizes } from '@/shared/lib';
import { Check, Slash } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type ProductWithItems = Product & { items: ProductItem[] };

interface Props {
  products: ProductWithItems[];
  onSubmit: (leftItemId: number, rightItemId: number) => void;
  loading?: boolean;
  className?: string;
}

export const ChooseHalfHalfForm: React.FC<Props> = ({ products, onSubmit, loading, className }) => {
  const [size, setSize] = React.useState<PizzaSize>(30);
  const [type, setType] = React.useState<PizzaType>(1);
  const [leftId, setLeftId] = React.useState<number | null>(null);
  const [rightId, setRightId] = React.useState<number | null>(null);

  const allItems = products.flatMap((pr) => pr.items);
  const availableSizes = getAvailablePizzaSizes(type, allItems);

  const available = products.filter((pr) =>
    pr.items.some((i) => i.size === size && i.pizzaType === type),
  );

  const getItem = (productId: number) =>
    products.find((pr) => pr.id === productId)?.items.find((i) => i.size === size && i.pizzaType === type) ?? null;

  const leftProduct = leftId ? products.find((pr) => pr.id === leftId) : null;
  const rightProduct = rightId ? products.find((pr) => pr.id === rightId) : null;
  const canSubmit = leftId !== null && rightId !== null;

  const totalPrice = React.useMemo(() => {
    if (!canSubmit) return 0;
    const l = getItem(leftId!);
    const r = getItem(rightId!);
    if (!l || !r) return 0;
    return Math.ceil((l.price + r.price) / 2);
  }, [leftId, rightId, size, type]);

  React.useEffect(() => { setLeftId(null); setRightId(null); }, [size, type]);

  const handleSubmit = () => {
    const l = leftId ? getItem(leftId) : null;
    const r = rightId ? getItem(rightId) : null;
    if (l && r) onSubmit(l.id, r.id);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <Title text="Пицца пополам" size="md" className="font-extrabold mb-1" />
      <p className="text-muted-foreground text-sm mb-5">Два разных вкуса в одной пицце — выбери правую и левую половину</p>
      <div className="flex flex-col gap-3 mb-6">
        <GroupVariants items={availableSizes} value={String(size)} onClick={(v) => setSize(Number(v) as PizzaSize)} />
        <GroupVariants items={pizzaTypes} value={String(type)} onClick={(v) => setType(Number(v) as PizzaType)} />
      </div>
      <div className="flex items-center justify-center gap-3 mb-6 p-4 rounded-2xl bg-secondary min-h-[88px]">
        {(leftProduct || rightProduct) ? (
          <>
            <div className="flex flex-col items-center gap-1 w-20">
              {leftProduct ? (
                <><img src={leftProduct.imageUrl} className="w-14 h-14 rounded-full object-cover border-2 border-primary" alt={leftProduct.name} />
                <span className="text-xs font-semibold text-center line-clamp-2">{leftProduct.name}</span></>
              ) : <div className="w-14 h-14 rounded-full border-2 border-dashed border-border" />}
            </div>
            <Slash size={18} className="text-muted-foreground rotate-12 shrink-0" />
            <div className="flex flex-col items-center gap-1 w-20">
              {rightProduct ? (
                <><img src={rightProduct.imageUrl} className="w-14 h-14 rounded-full object-cover border-2 border-primary" alt={rightProduct.name} />
                <span className="text-xs font-semibold text-center line-clamp-2">{rightProduct.name}</span></>
              ) : <div className="w-14 h-14 rounded-full border-2 border-dashed border-border" />}
            </div>
          </>
        ) : <p className="text-sm text-muted-foreground">Выберите две половинки ниже</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Левая половина</p>
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {available.map((pr) => (
              <button key={pr.id} type="button" disabled={pr.id === rightId} onClick={() => setLeftId(pr.id)}
                className={cn('flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-all text-sm disabled:opacity-40',
                  leftId === pr.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                <img src={pr.imageUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" alt={pr.name} />
                <span className="font-semibold line-clamp-1">{pr.name}</span>
                {leftId === pr.id && <Check size={14} className="ml-auto shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Правая половина</p>
          <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            {available.map((pr) => (
              <button key={pr.id} type="button" disabled={pr.id === leftId} onClick={() => setRightId(pr.id)}
                className={cn('flex items-center gap-2 p-2 rounded-xl border-2 text-left transition-all text-sm disabled:opacity-40',
                  rightId === pr.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40')}>
                <img src={pr.imageUrl} className="w-8 h-8 rounded-lg object-cover shrink-0" alt={pr.name} />
                <span className="font-semibold line-clamp-1">{pr.name}</span>
                {rightId === pr.id && <Check size={14} className="ml-auto shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Button loading={loading} onClick={handleSubmit} disabled={!canSubmit} className="h-13 rounded-2xl font-bold text-base">
        {canSubmit ? 'Добавить в корзину · ' + totalPrice + ' TJS' : 'Выберите две половинки'}
      </Button>
    </div>
  );
};
