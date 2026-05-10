import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getUserSession } from '@/back/lib/get-user-session';

const ReviewBody = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ message: 'Вы не авторизованы' }, { status: 401 });
    }

    const parsed = ReviewBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Bad request' },
        { status: 400 },
      );
    }
    const { productId, rating, comment } = parsed.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ message: 'Товар не найден' }, { status: 404 });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        product: { connect: { id: productId } },
        user: { connect: { id: Number(session.id) } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error [REVIEWS_POST]', error);
    return NextResponse.json({ message: 'Ошибка при создании отзыва' }, { status: 500 });
  }
}
