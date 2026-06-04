import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ message: 'Вы не авторизованы' }, { status: 401 });
    }

    const reviewId = Number(params.id);

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ message: 'Отзыв не найден' }, { status: 404 });
    }

    if (review.userId !== Number(session.id) && session.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Нет прав на удаление' }, { status: 403 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ message: 'Отзыв удален' });
  } catch (error) {
    console.error('Error [REVIEWS_DELETE]', error);
    return NextResponse.json({ message: 'Ошибка при удалении отзыва' }, { status: 500 });
  }
}
