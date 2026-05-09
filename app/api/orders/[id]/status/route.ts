import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();
    const { status, userId: bodyUserId } = await req.json();
    const orderId = Number(params.id);

    let userId: number;
    let userRole: string;

    if (session) {
      userId = Number(session.id);
      userRole = session.role;
    } else if (bodyUserId) {
      const user = await prisma.user.findUnique({
        where: { id: Number(bodyUserId) }
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
      return NextResponse.json({ message: 'Нет доступа' }, { status: 403 });
    }

    const updateData: any = { status };
    
    // Если курьер берет заказ, записываем его ID в заказ
    if (status === OrderStatus.DELIVERING) {
      updateData.courierId = userId;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error [ORDER_STATUS_PATCH]', error);
    return NextResponse.json({ message: 'Ошибка при обновлении статуса' }, { status: 500 });
  }
}
