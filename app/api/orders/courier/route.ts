import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

export async function GET() {
  try {
    const session = await getUserSession();

    if (!session || session.role !== 'COURIER') {
      return NextResponse.json({ message: 'Нет доступа' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { status: OrderStatus.READY }, // Готовы к выдаче
          { courierId: Number(session.id), status: OrderStatus.DELIVERING } // Те, что уже везет этот курьер
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
