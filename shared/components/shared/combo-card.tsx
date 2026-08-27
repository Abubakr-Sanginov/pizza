'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import { Button } from '../ui';
import { cn } from '@/shared/lib/utils';
import { BlurImage } from './blur-image';

interface ComboItem {
  product: { id: number; name: string; imageUrl: string };
  quantity: number;
}

export interface ComboData {
  id: number;
  name: string;
  description?: string | null;
  imageUrl: string;
  price: number;
  discount: number;
  items: ComboItem[];
}

interface Props { combo: ComboData; className?: string; }

export const ComboCard: React.FC<Props> = ({ combo, className }) => {
  const [loading, setLoading] = React.useState(false);
  const originalPrice = combo.discount > 0 ? Math.round(combo.price / (1 - combo.discount / 100)) : null;

  const handleAdd = async () => {
    setLoading(true);
    try {
      toast.success('«' + combo.name + '» добавлено в корзину!');
    } finally { setLoading(false); }
  };

  return (
    <div className={cn('relative bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-200 flex flex-col', className)}>
      {combo.discount > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-xl">
          -{combo.discount}%
        </div>
      )}
      <BlurImage src={combo.imageUrl} alt={combo.name} className="w-full h-44" imageClassName="w-full h-full object-cover" />
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-extrabold text-base mb-1 leading-tight">{combo.name}</h3>
        {combo.description && <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{combo.description}</p>}
        <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
          {combo.items.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-secondary rounded-full px-2.5 py-1">
              {item.quantity > 1 && <span className="font-bold text-primary">{item.quantity}x</span>}
              {item.product.name}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold">{combo.price} TJS</span>
            {originalPrice && <span className="text-xs text-muted-foreground line-through">{originalPrice} TJS</span>}
          </div>
          <Button loading={loading} onClick={handleAdd} size="sm" className="rounded-xl font-bold gap-1.5">
            <ShoppingCart size={15} />
            В корзину
          </Button>
        </div>
      </div>
    </div>
  );
};
