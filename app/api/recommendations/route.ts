import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const CROSS_SELL_CATEGORIES = ['Напитки', 'Закуски', 'Завтрак', 'Коктейли'];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeRaw = searchParams.get('exclude') || '';
    const exclude = excludeRaw
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);

    const products = await prisma.product.findMany({
      where: {
        category: { name: { in: CROSS_SELL_CATEGORIES } },
        ...(exclude.length ? { id: { notIn: exclude } } : {}),
      },
      include: {
        items: { orderBy: { price: 'asc' }, take: 1 },
      },
      take: 6,
    });

    const filtered = products
      .filter((p) => p.items.length > 0)
      .map((p) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.imageUrl,
        price: p.items[0].price,
        productItemId: p.items[0].id,
      }));

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error('[RECOMMENDATIONS_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
