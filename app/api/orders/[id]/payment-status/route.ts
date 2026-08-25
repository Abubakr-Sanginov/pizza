import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { getYooKassaPayment, yookassaConfigured } from '@/back/services/yookassa';
import { settleYooKassaCanceled, settleYooKassaSucceeded } from '@/back/lib/yookassa-settle';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      paymentStatus: true,
      paymentMethod: true,
      paymentProvider: true,
      paymentRef: true,
      status: true,
    },
  });
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Активная верификация: вебхук может не дойти (например, dev-сервер на localhost),
  // поэтому пока заказ PENDING — спрашиваем статус платежа у API ЮKassa напрямую.
  if (
    yookassaConfigured &&
    order.paymentStatus === 'PENDING' &&
    order.paymentRef &&
    (order.paymentProvider === 'YOOKASSA' || order.paymentMethod === 'YOOKASSA')
  ) {
    try {
      const payment = await getYooKassaPayment(order.paymentRef);
      if (payment.status === 'succeeded') {
        await settleYooKassaSucceeded(order.id, order.paymentRef, 'yookassa-verification');
        return NextResponse.json({ ...order, paymentStatus: 'PAID' });
      }
      if (payment.status === 'canceled') {
        await settleYooKassaCanceled(order.id);
        return NextResponse.json({ ...order, paymentStatus: 'FAILED' });
      }
    } catch (e) {
      console.error('[payment-status] YooKassa verification failed', e);
    }
  }

  const current = await prisma.order.findUnique({
    where: { id: order.id },
    select: { id: true, paymentStatus: true, paymentMethod: true, status: true },
  });
  return NextResponse.json(current);
}
