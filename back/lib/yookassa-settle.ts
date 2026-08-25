import { prisma } from '@/back/prisma/prisma-client';
import { sendOrderToIiko } from '@/back/services/iiko';
import { accrueBonus } from '@/back/lib/bonus';
import { sendOrderNotification } from '@/bot/service';

/**
 * Отмечает заказ оплаченным и выполняет все сопутствующие действия
 * (очистка корзины, синхронизация с iiko, начисление бонусов).
 * Используется и вебхуком ЮKassa, и активной верификацией статуса.
 */
export async function settleYooKassaSucceeded(
  orderId: number,
  paymentId: string,
  source: string,
): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === 'PAID') return;

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      paymentProvider: 'YOOKASSA',
      paymentRef: paymentId,
      paymentConfirmedAt: new Date(),
      paymentConfirmedBy: source,
    },
  });

  try {
    const cart = await prisma.cart.findFirst({ where: { token: order.token } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
    }
  } catch (e) {
    console.error(`[YooKassa settle:${source}] cart cleanup failed`, e);
  }

  let orderItems: any[] = [];
  try {
    orderItems =
      typeof order.items === 'string'
        ? JSON.parse(order.items)
        : (order.items as any) ?? [];
  } catch (parseErr) {
    console.error(`[YooKassa settle:${source}] failed to parse order.items`, parseErr);
    await prisma.order.update({
      where: { id: updated.id },
      data: {
        iikoSyncAttempts: { increment: 1 },
        iikoSyncError: `Failed to parse order items JSON (${source})`,
      },
    });
    orderItems = [];
  }

  if (!order.iikoOrderId && orderItems.length > 0) {
    try {
      const result = await sendOrderToIiko(updated, orderItems);
      if (result.status === 'failed') {
        console.warn(`[YooKassa settle:${source}] iiko sync failed for order ${updated.id}: ${result.reason}`);
      }
    } catch (e) {
      console.error(`[YooKassa settle:${source}] iiko crashed`, e);
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
      console.error(`[YooKassa settle:${source}] accrueBonus failed`, e);
    }
  }

  // Уведомление в бот — только когда заказ фактически оплачен
  try {
    await sendOrderNotification(
      updated.id,
      updated.totalAmount,
      updated.fullName,
      updated.phone,
      updated.address || '',
      orderItems,
      updated.storeId,
      {
        entrance: updated.entrance,
        floor: updated.floor,
        doorCode: updated.doorCode,
        apartment: updated.apartment,
      },
    );
  } catch (e) {
    console.error(`[YooKassa settle:${source}] sendOrderNotification failed`, e);
  }
}

export async function settleYooKassaCanceled(orderId: number): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'FAILED' },
  });
}
