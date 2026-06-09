export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title, DeleteButton } from '@/shared/components/shared';
import { Star } from 'lucide-react';
import { deleteReview } from '@/back/actions/review-actions';
import { revalidatePath } from 'next/cache';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function ReviewsPage() {
  const t = getAdminT();
  const reviews = await prisma.review.findMany({
    include: {
      user: true,
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const onDelete = async (id: number) => {
    'use server';
    await deleteReview(id);
    revalidatePath('/dashboard/reviews');
  };

  return (
    <div className="p-0 md:p-10">
      <Title text={t('admin.reviews.title')} size="lg" className="font-bold mb-10 px-4 md:px-0" />

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="p-4 font-bold text-muted-foreground">{t('admin.common.id')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.reviews.user')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.reviews.product')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.reviews.rating')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.reviews.comment')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.reviews.date')}</th>
              <th className="p-4 font-bold text-muted-foreground">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b border-border hover:bg-muted transition-colors">
                <td className="p-4 text-muted-foreground text-sm">#{review.id}</td>
                <td className="p-4 font-medium">{review.user.fullName}</td>
                <td className="p-4 text-sm text-muted-foreground">{review.product.name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-foreground">{review.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                  {review.comment || <span className="text-muted-foreground/50 italic">{t('admin.reviews.noComment')}</span>}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                 <td className="p-4 text-right">
                    <DeleteButton
                      onDelete={async () => {
                        'use server';
                        await deleteReview(review.id);
                        revalidatePath('/dashboard/reviews');
                      }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-auto rounded-lg"
                    />
                  </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-muted-foreground">
                  {t('admin.reviews.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
