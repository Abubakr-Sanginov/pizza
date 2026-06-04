import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { sendOrderToIiko } from '@/back/services/iiko';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.PAYMENT_INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { orderId, provider, ref, confirmedBy, proofUrl } = await req.json();

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (order.paymentStatus === 'PAID') {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      paymentProvider: provider ?? null,
      paymentRef: ref ?? null,
      paymentProof: proofUrl ?? null,
      paymentConfirmedAt: new Date(),
      paymentConfirmedBy: confirmedBy ?? null,
    },
  });

  try {
    const cart = await prisma.cart.findFirst({ where: { token: order.token } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
    }
  } catch (e) {
    console.error('[Payments] cart cleanup failed', e);
  }

  if (!order.iikoOrderId) {
    try {
      await sendOrderToIiko(updated, JSON.parse(order.items as any));
    } catch (e) {
      console.error('[Payments] iiko sync failed', e);
    }
  }

  return NextResponse.json({ ok: true });
}
