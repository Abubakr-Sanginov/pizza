import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const combos = await (prisma as any).combo.findMany({
      where: { active: true },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, imageUrl: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(combos);
  } catch (e) {
    console.error('[COMBOS_GET]', e);
    return NextResponse.json([]);
  }
}
