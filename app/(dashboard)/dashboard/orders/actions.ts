'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { OrderStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  try {
    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    // If order is completed, update global stats
    if (status === 'SUCCEEDED') {
      await prisma.globalStat.upsert({
        where: { id: 1 },
        update: {
          totalRevenue: { increment: order.totalAmount },
          totalOrders: { increment: 1 },
        },
        create: {
          id: 1,
          totalRevenue: order.totalAmount,
          totalOrders: 1,
        },
      });
    }

    revalidatePath('/dashboard/orders');
    revalidatePath('/profile/orders');
    return { success: true };
  } catch (error) {
    console.error('[UPDATE_ORDER_STATUS]', error);
    throw new Error('Failed to update order status');
  }
}
