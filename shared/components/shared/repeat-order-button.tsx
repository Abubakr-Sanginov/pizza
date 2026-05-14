'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Repeat } from 'lucide-react';

import { Button } from '../ui/button';
import { useCartStore } from '@/shared/store';

interface Props {
  orderId: number;
  className?: string;
}

export const RepeatOrderButton: React.FC<Props> = ({ orderId, className }) => {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const fetchCartItems = useCartStore((s) => s.fetchCartItems);

  const onRepeat = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(`/api/orders/${orderId}/repeat`);
      const added = data?.added ?? 0;
      const skipped = data?.skipped ?? 0;
      await fetchCartItems();
      if (added > 0) {
        toast.success(
          `Добавлено в корзину: ${added}${skipped > 0 ? ` (пропущено: ${skipped})` : ''}`,
        );
        router.push('/checkout');
      } else {
        toast.error('Не удалось добавить — товары могут быть недоступны');
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? 'Не удалось повторить заказ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onRepeat}
      loading={loading}
      className={className}>
      <Repeat size={16} className="mr-1.5" />
      Повторить
    </Button>
  );
};
