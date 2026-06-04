import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { verifyAlifCallback } from '@/back/services/alif';
import { sendOrderToIiko } from '@/back/services/iiko';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 });
  }

  console.log('[Alif callback]', body);

  const orderIdRaw: string = body.order_id || '';
  const match = orderIdRaw.match(/^ORDER_(\d+)_/);
  if (!match) return NextResponse.json({ error: 'Bad order_id format' }, { status: 400 });

  const orderId = Number(match[1]);
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const okSignature =
    !body.callback_token ||
    verifyAlifCallback({
      order_id: body.order_id,
      amount: body.amount,
      callback_token: body.callback_token,
    });

  if (!okSignature) {
    return NextResponse.json({ error: 'Bad signature' }, { status: 401 });
  }

  const status = String(body.status || body.code || '').toLowerCase();
  const isSuccess = status === 'ok' || status === 'success' || status === '200' || body.code === 200;

  if (isSuccess) {
    if (order.paymentStatus !== 'PAID') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentProvider: 'ALIF',
          paymentRef: body.transaction_id || body.payment_id || orderIdRaw,
          paymentConfirmedAt: new Date(),
          paymentConfirmedBy: 'alif-webhook',
        },
      });

      try {
        const cart = await prisma.cart.findFirst({ where: { token: order.token } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
          await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
        }
      } catch (e) {
        console.error('[Alif callback] cart cleanup failed', e);
      }

      if (!order.iikoOrderId) {
        try {
          await sendOrderToIiko(updated, JSON.parse(order.items as any));
        } catch (e) {
          console.error('[Alif callback] iiko sync failed', e);
        }
      }
    }
  } else {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED' },
    });
  }

  return NextResponse.json({ ok: true });
}
