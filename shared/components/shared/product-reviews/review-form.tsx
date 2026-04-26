'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { Button, Textarea } from '@/shared/components/ui';
import { addReview } from '@/back/actions/review-actions';
import toast from 'react-hot-toast';

interface Props {
  productId: number;
  onSuccess?: VoidFunction;
  className?: string;
}

export const ReviewForm: React.FC<Props> = ({ productId, onSuccess, className }) => {
  const [rating, setRating] = React.useState(0);
  const [hover, setHover] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async () => {
    if (rating === 0) {
      return toast.error('Пожалуйста, выберите оценку');
    }

    try {
      setLoading(true);
      await addReview(productId, rating, comment);
      toast.success('Отзыв успешно добавлен!');
      setRating(0);
      setComment('');
      onSuccess?.();
    } catch (error) {
      toast.error('Не удалось добавить отзыв');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('p-6 bg-gray-50 rounded-2xl', className)}>
      <h3 className="text-lg font-bold mb-4">Оставить отзыв</h3>

      <div className="flex gap-2 mb-6">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          return (
            <button
              key={i}
              type="button"
              className="focus:outline-none transition-transform active:scale-90"
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}>
              <Star
                size={28}
                className={cn(
                  'transition-colors',
                  starValue <= (hover || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300',
                )}
              />
            </button>
          );
        })}
      </div>

      <Textarea
        placeholder="Поделитесь вашими впечатлениями о продукте..."
        className="mb-4 bg-white border-gray-200 focus:ring-primary h-24"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <Button
        disabled={loading}
        onClick={onSubmit}
        className="w-full h-12 text-base font-bold rounded-xl">
        Отправить отзыв
      </Button>
    </div>
  );
};
