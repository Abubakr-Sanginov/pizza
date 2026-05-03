import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ message: 'Вы не авторизованы' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.productId || !data.rating) {
      return NextResponse.json({ message: 'Не все поля заполнены' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: Number(data.rating),
        comment: data.comment || '',
        product: { connect: { id: Number(data.productId) } },
        user: { connect: { id: Number(session.id) } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error [REVIEWS_POST]', error);
    return NextResponse.json({ message: 'Ошибка при создании отзыва' }, { status: 500 });
  }
}
