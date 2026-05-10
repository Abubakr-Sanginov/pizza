'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { OrderStatus, UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '@/back/lib/get-user-session';
import { notifyOrderStatus } from '@/back/lib/notify-order-status';

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  try {
    const session = await getUserSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Role-based permissions
    if (session.role === 'COURIER') {
      // Courier can only update orders assigned to them
      if (order.courierId !== Number(session.id)) {
        throw new Error('Access denied: You are not assigned to this order');
      }

      // Courier cannot update if food is still cooking
      if (order.status === 'COOKING' && status !== 'COOKING') {
        throw new Error('Wait until the food is ready!');
      }

      // Courier can only change to DELIVERING, SUCCEEDED, or CANCELLED
      const allowedStatuses: OrderStatus[] = ['DELIVERING', 'SUCCEEDED', 'CANCELLED'];
      if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid status for courier');
      }
    } else if (session.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });

    if (order.status !== status) {
      notifyOrderStatus(orderId, status).catch((e) =>
        console.error('[notifyOrderStatus]', e),
      );
    }

    // Если заказ стал готов, пробуем назначить курьера автоматически
    if (status === 'READY') {
      await autoAssignCouriers();
    }

    // If order is completed, update global stats
    if (status === 'SUCCEEDED') {
      await prisma.globalStat.upsert({
        where: { id: 1 },
        update: {
          totalRevenue: { increment: updatedOrder.totalAmount },
          totalOrders: { increment: 1 },
        },
        create: {
          id: 1,
          totalRevenue: updatedOrder.totalAmount,
          totalOrders: 1,
        },
      });
    }

    revalidatePath('/dashboard/orders');
    revalidatePath('/profile/orders');
    revalidatePath('/dashboard/courier');
    return { success: true };
  } catch (error) {
    console.error('[UPDATE_ORDER_STATUS]', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to update order status' };
  }
}

export async function assignCourier(orderId: number, courierId: number | null) {
  try {
    const session = await getUserSession();

    if (!session || session.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { courierId },
    });

    revalidatePath('/dashboard/orders');
    return { success: true };
  } catch (error) {
    console.error('[ASSIGN_COURIER]', error);
    return { success: false, message: 'Failed to assign courier' };
  }
}

export async function autoAssignCouriers() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const unassignedOrders = await prisma.order.findMany({
      where: {
        courierId: null,
        status: { in: ['COOKING', 'READY'] },
        createdAt: { lt: fiveMinutesAgo },
      },
    });

    if (unassignedOrders.length === 0) return { count: 0 };

    const couriers = await prisma.user.findMany({
      where: { role: 'COURIER' },
      include: {
        _count: {
          select: {
            courierOrders: {
              where: { status: { in: ['COOKING', 'READY', 'DELIVERING'] } }
            }
          }
        }
      }
    });

    if (couriers.length === 0) return { count: 0 };

    let assignedCount = 0;
    for (const order of unassignedOrders) {
      // Находим курьера с минимальным количеством заказов
      const bestCourier = couriers.sort((a, b) => a._count.courierOrders - b._count.courierOrders)[0];
      
      await prisma.order.update({
        where: { id: order.id },
        data: { courierId: bestCourier.id },
      });
      
      // Увеличиваем счетчик локально для следующей итерации цикла
      bestCourier._count.courierOrders++;
      assignedCount++;
    }

    revalidatePath('/dashboard/orders');
    return { count: assignedCount };
  } catch (error) {
    console.error('[AUTO_ASSIGN_COURIERS]', error);
    return { count: 0 };
  }
}
