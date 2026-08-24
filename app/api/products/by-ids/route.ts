import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idsRaw = searchParams.get('ids') || '';
    const ids = idsRaw
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 20);

    if (ids.length === 0) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: ids }, name: { not: 'Своя пицца' } },
      include: {
        items: { orderBy: { price: 'asc' } },
        ingredients: true,
      },
    });

    const map = new Map(products.map((p) => [p.id, p]));
    const ordered = ids.map((id) => map.get(id)).filter(Boolean);

    return NextResponse.json(ordered);
  } catch (error: any) {
    console.error('[PRODUCTS_BY_IDS]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
