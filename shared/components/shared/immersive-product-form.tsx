'use client';

import React from 'react';
import { cn } from '@/shared/lib/utils';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Share2, ChevronDown, Plus } from 'lucide-react';
import { ProductWithRelations } from '@/@types/prisma';
import { useCartStore } from '@/shared/store';
import { BlurImage } from './blur-image';
import { Button } from '../ui';

interface RelatedProduct {
  id: number;
  name: string;
  imageUrl: string;
  gifUrl?: string | null;
  items: { id: number; price: number; size: number | null }[];
}

interface Props {
  product: ProductWithRelations;
  relatedProducts?: RelatedProduct[];
  loading?: boolean;
  onSubmit?: VoidFunction;
  className?: string;
}

export const ImmersiveProductForm: React.FC<Props> = ({
  product,
  relatedProducts = [],
  loading,
  onSubmit,
  className,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const [addCartItem, cartLoading] = useCartStore((state) => [state.addCartItem, state.loading]);

  const items = product.items;
  const [selectedItemId, setSelectedItemId] = React.useState<number | undefined>(items[0]?.id);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? items[0];
  const price = selectedItem?.price ?? 0;
  const busy = loading || cartLoading;

  const nutrition = [
    { value: product.calories, unit: 'ккал', label: 'энергия' },
    { value: product.fats, unit: 'г', label: 'жиры' },
    { value: product.carbs, unit: 'г', label: 'углеводы' },
    { value: product.proteins, unit: 'г', label: 'белки' },
  ].filter((n) => n.value != null);

  const handleAdd = async () => {
    if (!selectedItem) return;
    try {
      await addCartItem({ productItemId: selectedItem.id });
      toast.success(product.name + ' добавлена в корзину');
      onSubmit?.();
    } catch (err) {
      toast.error('Не удалось добавить товар в корзину');
      console.error(err);
    }
  };

  const handleAddRelated = async (productItemId: number, name: string) => {
    try {
      await addCartItem({ productItemId });
      toast.success(name + ' добавлен в корзину');
    } catch (err) {
      toast.error('Не удалось добавить товар в корзину');
      console.error(err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch {
        /* пользователь отменил — это не ошибка */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    }
  };

  return (
    <div className={cn('fixed inset-0 z-50 flex flex-col overflow-hidden bg-black text-white', className)}>
      {/* Фон: гифка товара (если есть) на весь экран, иначе фото */}
      <img
        src={product.gifUrl || product.imageUrl}
        alt={product.name}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

      {/* Шапка */}
      <div className="relative z-10 flex items-start gap-3 px-4 pt-5">
        <button
          onClick={() => router.back()}
          aria-label="Закрыть"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60">
          <X size={20} />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold leading-snug drop-shadow-md">{product.name}</h1>
        <button
          onClick={handleShare}
          aria-label="Поделиться"
          className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-md transition hover:bg-black/60">
          <Share2 size={18} />
        </button>
      </div>

      {/* КБЖУ */}
      {nutrition.length > 0 && (
        <div className="relative z-10 mt-4 px-4">
          <div className="grid grid-cols-4 gap-2">
            {nutrition.map((n) => (
              <div key={n.label} className="text-center">
                <div className="text-lg font-semibold">
                  {n.value} {n.unit}
                </div>
                <div className="text-xs text-white/60">{n.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setDetailsOpen((v) => !v)}
            className="mx-auto mt-3 flex items-center gap-1 rounded-full bg-black/40 px-4 py-1.5 text-sm backdrop-blur-md transition hover:bg-black/60">
            подробнее
            <ChevronDown size={14} className={cn('transition-transform', detailsOpen && 'rotate-180')} />
          </button>
          {detailsOpen && (
            <div className="mt-3 rounded-2xl bg-black/50 p-4 text-sm backdrop-blur-md">
              {product.ingredients.length > 0 ? (
                <p>
                  <span className="text-white/60">Состав: </span>
                  {product.ingredients.map((ing) => ing.name).join(', ')}
                </p>
              ) : (
                <p className="text-white/60">Состав не указан</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Доп товары (блюр) */}
      {relatedProducts.length > 0 && (
        <div className="relative z-10 mb-4">
          <div className="scrollbar flex gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {relatedProducts.map((rel) => {
              const relItem = rel.items[0];
              if (!relItem) return null;
              return (
                <div
                  key={rel.id}
                  className="relative flex w-[104px] shrink-0 flex-col items-center overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-2 backdrop-blur-md">
                  <button
                    onClick={() => handleAddRelated(relItem.id, rel.name)}
                    aria-label={`Добавить ${rel.name}`}
                    className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur transition hover:bg-white/35">
                    <Plus size={18} />
                  </button>
                  <BlurImage
                    src={rel.imageUrl}
                    alt={rel.name}
                    className="mt-2 h-14 w-14"
                    imageClassName="w-full h-full object-contain"
                  />
                  <div className="mt-1 line-clamp-2 min-h-[32px] text-center text-xs leading-tight text-white/90">
                    {rel.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Нижняя панель: размер + цена */}
      <div className="relative z-10 flex items-center gap-3 px-4 pb-6">
        {items.some((item) => item.size) && (
          <div className="flex gap-2">
            {items
              .filter((item) => item.size)
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    'h-[52px] rounded-full px-5 text-base font-medium backdrop-blur-md transition',
                    item.id === selectedItem?.id
                      ? 'bg-white text-black'
                      : 'bg-black/40 text-white hover:bg-black/60',
                  )}>
                  {item.size} мл
                </button>
              ))}
          </div>
        )}

        <Button
          loading={busy}
          onClick={handleAdd}
          className={cn(
            'h-[52px] rounded-full bg-indigo-600 text-lg font-semibold hover:bg-indigo-500',
            items.some((item) => item.size) ? 'ml-auto max-w-[220px] flex-1' : 'w-full',
          )}>
          + {price} {t('currency', { defaultValue: 'TJS' })}
        </Button>
      </div>
    </div>
  );
};
