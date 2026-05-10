import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';

import { getUserSession } from '@/back/lib/get-user-session';

/**
 * Returns orders of the authenticated user only. Without auth — 401.
 * We never trust `?userId` from the query string alone; mobile fallback
 * accepts it only if the caller's cartToken is bound to that same user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    let userId: number | null = session ? Number(session.id) : null;

    if (!userId) {
      const queryUserId = req.nextUrl.searchParams.get('userId');
      const token = req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token');
      if (queryUserId && token) {
        const cart = await prisma.cart.findFirst({
          where: { token, userId: Number(queryUserId) },
          select: { userId: true },
        });
        if (cart?.userId) userId = cart.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('[ORDERS_GET] Server error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
