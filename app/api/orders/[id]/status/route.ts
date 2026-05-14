import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';
import { notifyOrderStatus } from '@/back/lib/notify-order-status';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = Number(params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return NextResponse.json({ message: 'Неверный orderId' }, { status: 400 });
  }
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, deliveryType: true, updatedAt: true },
  });
  if (!order) {
    return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
  }
  return NextResponse.json(order, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();
    const { status, userId: bodyUserId } = await req.json();
    const orderId = Number(params.id);

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ message: 'Неверный orderId' }, { status: 400 });
    }
    const allowed = Object.values(OrderStatus);
    if (!allowed.includes(status)) {
      return NextResponse.json({ message: 'Неверный статус' }, { status: 400 });
    }

    let userId: number | null = null;
    let userRole: string | null = null;

    if (session) {
      userId = Number(session.id);
      userRole = session.role;
    } else if (bodyUserId) {
      // Mobile fallback: must present cartToken bound to that user
      const token = req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token');
      if (token) {
        const cart = await prisma.cart.findFirst({
          where: { token, userId: Number(bodyUserId) },
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
      return NextResponse.json({ message: 'Нет прав' }, { status: 403 });
    }

    // Courier can only update orders they're assigned to
    if (userRole === 'COURIER') {
      const target = await prisma.order.findUnique({
        where: { id: orderId },
        select: { courierId: true, status: true },
      });
      if (!target) {
        return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
      }
      const canTakeReady = target.courierId === null && target.status === 'READY' && status === 'DELIVERING';
      const ownsOrder = target.courierId === userId;
      if (!canTakeReady && !ownsOrder) {
        return NextResponse.json({ message: 'Нет прав на этот заказ' }, { status: 403 });
      }
    }

    const updateData: any = { status };
    
    // Если курьер берет заказ, записываем его ID в заказ
    if (status === OrderStatus.DELIVERING) {
      updateData.courierId = userId;
    }

    const previous = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (previous && previous.status !== status) {
      notifyOrderStatus(orderId, status).catch((e) =>
        console.error('[notifyOrderStatus]', e),
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error [ORDER_STATUS_PATCH]', error);
    return NextResponse.json({ message: 'Ошибка при обновлении статуса' }, { status: 500 });
  }
}
