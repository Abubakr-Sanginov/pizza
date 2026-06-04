import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');

    let userId: number | null = null;
    let userRole: string | null = null;

    if (session) {
      userId = Number(session.id);
      userRole = session.role;
    } else if (queryUserId) {

      const token = req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token');
      if (token) {
        const cart = await prisma.cart.findFirst({
          where: { token, userId: Number(queryUserId) },
          select: { userId: true },
        });
        if (cart?.userId) {
          const user = await prisma.user.findUnique({ where: { id: cart.userId } });
          if (user) {
            userId = user.id;
            userRole = user.role;
          }
        }
      }
    }

    if (!userId || !userRole) {
      return NextResponse.json({ message: 'Нет доступа' }, { status: 401 });
    }

    if (userRole !== 'COURIER' && userRole !== 'ADMIN') {
      return NextResponse.json({ message: 'У вас нет прав курьера' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [

          {
            status: OrderStatus.READY,
            courierId: null
          },

          {
            courierId: userId,
            status: {
              in: [OrderStatus.COOKING, OrderStatus.READY, OrderStatus.DELIVERING]
            }
          }
        ]
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error [COURIER_ORDERS_GET]', error);
    return NextResponse.json({ message: 'Ошибка при получении заказов' }, { status: 500 });
  }
}
