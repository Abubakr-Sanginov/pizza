export const dynamic = 'force-dynamic';
import { prisma } from '@/back/prisma/prisma-client';
import { Title, DeleteButton } from '@/shared/components/shared';
import { Star } from 'lucide-react';
import { deleteReview } from '@/back/actions/review-actions';
import { revalidatePath } from 'next/cache';

export default async function ReviewsPage() {
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
      <Title text="Управление отзывами" size="lg" className="font-bold mb-10 px-4 md:px-0" />

      <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-bold text-gray-600">ID</th>
              <th className="p-4 font-bold text-gray-600">Пользователь</th>
              <th className="p-4 font-bold text-gray-600">Товар</th>
              <th className="p-4 font-bold text-gray-600">Оценка</th>
              <th className="p-4 font-bold text-gray-600">Комментарий</th>
              <th className="p-4 font-bold text-gray-600">Дата</th>
              <th className="p-4 font-bold text-gray-600">Действия</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-b hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-500 text-sm">#{review.id}</td>
                <td className="p-4 font-medium">{review.user.fullName}</td>
                <td className="p-4 text-sm text-gray-600">{review.product.name}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1 text-yellow-400">
                    <Star size={16} fill="currentColor" />
                    <span className="font-bold text-gray-900">{review.rating}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                  {review.comment || <span className="text-gray-300 italic">Нет комментария</span>}
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString()}
                </td>
                 <td className="p-4 text-right">
                    <DeleteButton
                      onDelete={async () => {
                        'use server';
                        await deleteReview(review.id);
                        revalidatePath('/dashboard/reviews');
                      }}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-auto rounded-lg"
                    />
                  </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-400">
                  Отзывов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
