import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';

/**
 * GET — list user's favorited products (with details for rendering).
 */
export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: Number(session.id) },
    include: {
      product: {
        include: {
          items: { orderBy: { price: 'asc' } },
          ingredients: true,
          reviews: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(favorites.map((f) => f.product));
}

const ToggleBody = z.object({ productId: z.coerce.number().int().positive() });

/**
 * POST — toggle a product in/out of user's favorites.
 * Body: { productId }. Returns: { favorited: boolean }.
 */
export async function POST(req: NextRequest) {
  const session = await getUserSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = ToggleBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Bad request' },
      { status: 400 },
    );
  }

  const userId = Number(session.id);
  const { productId } = parsed.data;

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  // Ensure product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
  }

  await prisma.favorite.create({ data: { userId, productId } });
  return NextResponse.json({ favorited: true });
}
