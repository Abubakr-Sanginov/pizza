import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { sendOrderToIiko } from '@/back/services/iiko';
import { accrueBonus } from '@/back/lib/bonus';
import { sendOrderNotification } from '@/bot/service';

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

  // FIX: безопасный парсинг — если JSON сломан, записываем ошибку в БД
  // чтобы retry-воркер подхватил заказ позже
  let cartItems: any[];
  try {
    cartItems =
      typeof order.items === 'string'
        ? JSON.parse(order.items)
        : (order.items as any) ?? [];
  } catch (parseErr) {
    console.error('[Payments] failed to parse order.items', parseErr);
    await prisma.order.update({
      where: { id: updated.id },
      data: {
        iikoSyncAttempts: { increment: 1 },
        iikoSyncError: 'Failed to parse order items JSON (telegram confirm)',
      },
    });
    cartItems = [];
  }

  if (!order.iikoOrderId && cartItems.length > 0) {
    try {
      const result = await sendOrderToIiko(updated, cartItems);
      if (result.status === 'failed') {
        console.warn('[Payments] iiko sync failed for order '+order.id+': '+result.reason);
      } else if (result.status === 'skipped') {
        console.info('[Payments] iiko skipped for order '+order.id+': '+result.reason);
      }
    } catch (e) {
      console.error('[Payments] iiko sync crashed', e);
    }
  }

  if (order.userId) {
    try {
      await accrueBonus({
        userId: order.userId,
        orderTotal: order.totalAmount,
        orderId: order.id,
      });
    } catch (e) {
      console.error('[Payments] bonus accrue failed', e);
    }
  }

  // Уведомление в бот — только после подтверждения оплаты
  try {
    await sendOrderNotification(
      updated.id,
      updated.totalAmount,
      updated.fullName,
      updated.phone,
      updated.address || '',
      cartItems,
      order.storeId,
      {
        entrance: order.entrance,
        floor: order.floor,
        doorCode: order.doorCode,
        apartment: order.apartment,
      },
    );
  } catch (e) {
    console.error('[Payments] sendOrderNotification failed', e);
  }

  return NextResponse.json({ ok: true });
}
