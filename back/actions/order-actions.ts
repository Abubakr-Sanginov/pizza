'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus } from '@prisma/client';

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

    if (order.userId !== Number(session.id) && session.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

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
