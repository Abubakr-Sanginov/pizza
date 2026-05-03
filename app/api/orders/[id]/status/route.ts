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

    if (!session || (session.role !== 'COURIER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ message: 'Нет доступа' }, { status: 403 });
    }

    const { status } = await req.json();
    const orderId = Number(params.id);

    const updateData: any = { status };
    
    // Если курьер берет заказ, записываем его ID в заказ
    if (status === OrderStatus.DELIVERING) {
      updateData.courierId = Number(session.id);
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
