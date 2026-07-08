import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { getYooKassaPayment, yookassaConfigured } from '@/back/services/yookassa';
import { sendOrderToIiko } from '@/back/services/iiko';
import { accrueBonus } from '@/back/lib/bonus';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'yookassa-callback' });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 });
  }

  console.log('[YooKassa callback]', body);

  if (!yookassaConfigured) {
    return NextResponse.json({ error: 'YooKassa not configured' }, { status: 500 });
  }

  const event = body.event;
  const payment = body.object;

  if (!event || !payment) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const orderId = payment.metadata?.orderId;
  if (!orderId) {
    return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (event === 'payment.succeeded') {
    if (order.paymentStatus !== 'PAID') {
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentProvider: 'YOOKASSA',
          paymentRef: payment.id,
          paymentConfirmedAt: new Date(),
          paymentConfirmedBy: 'yookassa-webhook',
        },
      });

      try {
        const cart = await prisma.cart.findFirst({ where: { token: order.token } });
        if (cart) {
          await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
          await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
        }
      } catch (e) {
        console.error('[YooKassa callback] cart cleanup failed', e);
      }

      if (!order.iikoOrderId) {
        let cartItems: any[];
        try {
          cartItems =
            typeof order.items === 'string'
              ? JSON.parse(order.items)
              : (order.items as any) ?? [];
        } catch (parseErr) {
          console.error('[YooKassa callback] failed to parse order.items', parseErr);
          await prisma.order.update({
            where: { id: updated.id },
            data: {
              iikoSyncAttempts: { increment: 1 },
              iikoSyncError: 'Failed to parse order items JSON (yookassa callback)',
            },
          });
          return NextResponse.json({ ok: true });
        }
        try {
          const result = await sendOrderToIiko(updated, cartItems);
          if (result.status === 'failed') {
            console.warn(`[YooKassa callback] iiko sync failed for order ${updated.id}: ${result.reason}`);
          }
        } catch (e) {
          console.error('[YooKassa callback] iiko sync crashed', e);
        }
      }

      if (updated.userId) {
        try {
          await accrueBonus({
            userId: updated.userId,
            orderTotal: updated.totalAmount,
            orderId: updated.id,
          });
        } catch (e) {
          console.error('[YooKassa callback] accrueBonus failed', e);
        }
      }
    }
  } else if (event === 'payment.canceled') {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'FAILED' },
    });
  }

  return NextResponse.json({ ok: true });
}
