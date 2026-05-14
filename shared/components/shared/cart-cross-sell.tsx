'use client';

import React from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { useCart } from '@/shared/hooks';
import { cn } from '@/shared/lib/utils';
import toast from 'react-hot-toast';

interface Reco {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
  productItemId: number;
}

interface Props {
  className?: string;
}

export const CartCrossSell: React.FC<Props> = ({ className }) => {
  const { items, addCartItem } = useCart();
  const [recos, setRecos] = React.useState<Reco[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [addingId, setAddingId] = React.useState<number | null>(null);

  const productIdsInCart = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.productId))),
    [items],
  );

  React.useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;
    setLoading(true);
    axios
      .get<Reco[]>('/api/recommendations', {
        params: { exclude: productIdsInCart.join(',') },
      })
      .then((res) => {
        if (!cancelled) setRecos(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productIdsInCart.join(',')]);

  if (items.length === 0 || (!loading && recos.length === 0)) return null;

  const onAdd = async (reco: Reco) => {
    setAddingId(reco.id);
    try {
      await addCartItem({ productItemId: reco.productItemId });
      toast.success(`${reco.name} добавлено`);
    } catch {
      toast.error('Не удалось добавить');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className={cn('px-4', className)}>
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Добавьте к заказу
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar">
        {loading && recos.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-32 h-44 rounded-2xl bg-muted animate-pulse"
              />
            ))
          : recos.map((r) => (
              <div
                key={r.id}
                className="shrink-0 w-32 rounded-2xl glass p-3 flex flex-col items-center text-center">
                <img
                  src={r.imageUrl}
                  alt={r.name}
                  className="w-20 h-20 object-contain"
                />
                <div className="text-xs font-bold mt-1 line-clamp-2 leading-tight min-h-[2rem]">
                  {r.name}
                </div>
                <div className="text-sm font-black mt-1 mb-2">
                  {r.price}
                  <span className="text-[10px] text-muted-foreground"> TJS</span>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(r)}
                  disabled={addingId === r.id}
                  aria-label={`Добавить ${r.name}`}
                  className="w-8 h-8 rounded-full btn-gradient text-white flex items-center justify-center border-0 disabled:opacity-60 active:scale-90 transition-transform">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            ))}
      </div>
    </div>
  );
};
