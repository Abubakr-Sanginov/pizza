import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');

    let userId: number;
    let userRole: string;

    if (session) {
      userId = Number(session.id);
      userRole = session.role;
    } else if (queryUserId) {
      // Для мобильного приложения проверяем пользователя в БД
      const user = await prisma.user.findUnique({
        where: { id: Number(queryUserId) }
      });
      if (!user) {
        return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
      }
      userId = user.id;
      userRole = user.role;
    } else {
      return NextResponse.json({ message: 'Нет доступа' }, { status: 403 });
    }

    if (userRole !== 'COURIER' && userRole !== 'ADMIN') {
      return NextResponse.json({ message: 'У вас нет прав курьера' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          // Заказы, которые готовы, но еще ни на кого не назначены
          { 
            status: OrderStatus.READY, 
            courierId: null 
          },
          // Заказы, которые назначены именно этому курьеру и находятся в работе
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
