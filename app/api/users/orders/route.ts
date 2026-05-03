import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: Number(userId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ORDERS_GET] Server error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
