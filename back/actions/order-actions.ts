'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

/**
 * Delete an order from user's history.
 * Users can only delete their own CANCELLED orders.
 * SUCCEEDED orders are auto-deleted after 1 day.
 */
export async function deleteOrder(orderId: number) {
  try {
    const session = await getUserSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Users can only delete their own orders
    if (order.userId !== Number(session.id) && session.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

    // Only allow manual deletion for CANCELLED orders (or admin)
    if (order.status !== OrderStatus.CANCELLED && session.role !== 'ADMIN') {
      throw new Error('Can only manually delete cancelled orders');
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
}

/**
 * Auto-cleanup: delete SUCCEEDED and CANCELLED orders older than 1 day.
 * Called periodically (e.g., from the bot).
 */
export async function cleanupOldOrders() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.order.deleteMany({
    where: {
      status: {
        in: [OrderStatus.SUCCEEDED, OrderStatus.CANCELLED],
      },
      updatedAt: {
        lt: oneDayAgo,
      },
    },
  });

  return result.count;
}
