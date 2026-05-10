import { OrderStatus } from '@prisma/client';

import { prisma } from '@/back/prisma/prisma-client';
import { sendPushToUsers } from './send-push';

const STATUS_TITLES: Record<OrderStatus, string> = {
  PENDING: 'Заказ принят',
  COOKING: 'Заказ готовится',
  READY: 'Заказ готов',
  DELIVERING: 'Курьер в пути',
  SUCCEEDED: 'Заказ доставлен',
  CANCELLED: 'Заказ отменён',
};

const STATUS_BODIES: Record<OrderStatus, (orderId: number) => string> = {
  PENDING: (id) => `Мы приняли ваш заказ #${id}. Скоро начнём готовить!`,
  COOKING: (id) => `Заказ #${id} отправлен на кухню — повара уже работают над ним 🍕`,
  READY: (id) => `Заказ #${id} готов и ждёт курьера`,
  DELIVERING: (id) => `Курьер забрал ваш заказ #${id} и едет к вам`,
  SUCCEEDED: (id) => `Заказ #${id} доставлен. Приятного аппетита!`,
  CANCELLED: (id) => `К сожалению, заказ #${id} был отменён`,
};

export async function notifyOrderStatus(orderId: number, status: OrderStatus) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, status: true },
  });
  if (!order || !order.userId) return { skipped: true, reason: 'no userId' };

  const summary = await sendPushToUsers(
    {
      title: STATUS_TITLES[status],
      body: STATUS_BODIES[status](order.id),
      url: `/profile/orders/${order.id}`,
      channel: 'orders',
      data: { type: 'order_status', orderId: order.id, status },
    },
    { userIds: [order.userId], recordNotification: true },
  );

  return { skipped: false, summary };
}
