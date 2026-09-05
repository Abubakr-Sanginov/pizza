import { prisma } from '@/back/prisma/prisma-client';

/**
 * Списание остатков склада по заказу.
 * Вызывать после создания заказа.
 */
export async function decrementStockForOrder(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { items: true },
    });
    if (!order) return;

    const raw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    if (!Array.isArray(raw)) return;

    // Агрегируем количество по каждому варианту (productItemId)
    const quantities = new Map<number, number>();
    for (const item of raw) {
      const productItemId = Number(item?.productItem?.id ?? item?.productItemId);
      const qty = Number(item?.quantity ?? 0);
      if (Number.isFinite(productItemId) && productItemId > 0 && qty > 0) {
        quantities.set(productItemId, (quantities.get(productItemId) ?? 0) + qty);
      }
    }
    if (quantities.size === 0) return;

    await prisma.$transaction(
      Array.from(quantities.entries()).map(([productItemId, qty]) =>
        prisma.productItem.updateMany({
          where: { id: productItemId, stock: { not: null } },
          data: { stock: { decrement: qty } },
        }),
      ),
    );

    // Не даём уйти в минус
    const negative = await prisma.productItem.updateMany({
      where: { stock: { lt: 0 } },
      data: { stock: 0 },
    });
    if (negative.count > 0) {
      console.warn('[STOCK] Clamped negative stock values', { count: negative.count });
    }
  } catch (error) {
    console.error('Error [DECREMENT_STOCK_FOR_ORDER]', error);
  }
}

/**
 * Возврат остатков на склад при отмене заказа (если они ещё не возвращались).
 */
export async function restoreStockForOrder(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { items: true, status: true },
    });
    if (!order || order.status !== 'CANCELLED') return;

    const raw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    if (!Array.isArray(raw)) return;

    const quantities = new Map<number, number>();
    for (const item of raw) {
      const productItemId = Number(item?.productItem?.id ?? item?.productItemId);
      const qty = Number(item?.quantity ?? 0);
      if (Number.isFinite(productItemId) && productItemId > 0 && qty > 0) {
        quantities.set(productItemId, (quantities.get(productItemId) ?? 0) + qty);
      }
    }
    if (quantities.size === 0) return;

    await prisma.$transaction(
      Array.from(quantities.entries()).map(([productItemId, qty]) =>
        prisma.productItem.updateMany({
          where: { id: productItemId, stock: { not: null } },
          data: { stock: { increment: qty } },
        }),
      ),
    );
  } catch (error) {
    console.error('Error [RESTORE_STOCK_FOR_ORDER]', error);
  }
}
