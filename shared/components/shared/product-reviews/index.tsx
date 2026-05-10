'use client';

import React from 'react';
import { Title } from '../title';
import { ReviewCard } from './review-card';
import { ReviewForm } from './review-form';
import { ReviewWithUser } from '@/@types/prisma';
import { cn } from '@/shared/lib/utils';
import { useSession } from 'next-auth/react';

interface Props {
  productId: number;
  reviews: ReviewWithUser[];
  className?: string;
}

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export const ProductReviews: React.FC<Props> = ({ productId, reviews, className }) => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить отзыв?')) {
      try {
        const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Отзыв удален');
          router.refresh();
        } else {
          toast.error('Не удалось удалить отзыв');
        }
      } catch (error) {
        toast.error('Ошибка при удалении');
      }
    }
  };

  return (
    <div className={cn('p-8 border-t border-border bg-card text-card-foreground', className)}>
      <div className="flex items-center gap-3 mb-8">
        <Title text="Отзывы" size="md" className="font-extrabold" />
        <span className="text-muted-foreground font-medium">({reviews.length})</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 scrollbar">
          {reviews.length > 0 ? (
            reviews.map((review) => {
              const canDelete = session?.user && (Number(session.user.id) === review.userId || session.user.role === 'ADMIN');
              return (
                <ReviewCard
                  key={review.id}
                  fullName={review.user.fullName}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.createdAt}
                  canDelete={Boolean(canDelete)}
                  onDelete={() => handleDelete(review.id)}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-40 bg-muted rounded-2xl text-muted-foreground">
              <p>Отзывов пока нет</p>
              <p className="text-sm">Будьте первым, кто оставит отзыв!</p>
            </div>
          )}
        </div>

        <div>
          {session ? (
            <ReviewForm productId={productId} />
          ) : (
            <div className="p-8 bg-primary/10 border border-primary/20 rounded-2xl text-center">
              <p className="text-primary font-bold mb-2">Хотите оставить отзыв?</p>
              <p className="text-primary/80 text-sm">
                Войдите в аккаунт, чтобы поделиться своим мнением о продукте.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
