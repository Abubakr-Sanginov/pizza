import crypto from 'crypto';
import { OrderStatus, Prisma } from '@prisma/client';

import { prisma } from '@/back/prisma/prisma-client';
import { notifyOrderStatus } from '@/back/lib/notify-order-status';

import { IIKO_CONFIG } from './config';
import { mapIikoStatusToLocal } from './status-map';
import { syncMenu, syncStopList } from './menu';

export type IikoEventType =
  | 'DeliveryStatusUpdate'
  | 'DeliveryOrderUpdate'
  | 'MenuUpdate'
  | 'StopListUpdate'
  | string;

export interface IikoWebhookEvent {
  eventType: IikoEventType;
  eventInfo?: {
    orderId?: string;
    status?: string;
    courierId?: string;
    organizationId?: string;
  };
}

export function verifySignature(rawBody: string, signature: string | null | undefined): boolean {
  if (!IIKO_CONFIG.webhookSecret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac('sha256', IIKO_CONFIG.webhookSecret).update(rawBody).digest('hex');
  const provided = signature.startsWith('sha256=') ? signature.slice(7) : signature;
  if (expected.length !== provided.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export interface HandleResult {
  handled: boolean;
  reason: string;
}

export async function handleEvent(event: IikoWebhookEvent): Promise<HandleResult> {
  switch (event.eventType) {
    case 'MenuUpdate':
      syncMenu().catch((e) => console.error('[IIKO WEBHOOK] menu sync failed', e));
      return { handled: true, reason: 'menu sync triggered' };

    case 'StopListUpdate':
      syncStopList().catch((e) => console.error('[IIKO WEBHOOK] stop list sync failed', e));
      return { handled: true, reason: 'stop list sync triggered' };

    case 'DeliveryStatusUpdate':
    case 'DeliveryOrderUpdate':
      return handleDeliveryStatus(event);

    default:
      return { handled: false, reason: `ignored event ${event.eventType}` };
  }
}

async function handleDeliveryStatus(event: IikoWebhookEvent): Promise<HandleResult> {
  const info = event.eventInfo;
  if (!info?.orderId) return { handled: false, reason: 'missing orderId' };

  const order = await prisma.order.findFirst({ where: { iikoOrderId: info.orderId } });
  if (!order) return { handled: false, reason: `unknown iikoOrderId ${info.orderId}` };

  const localStatus = mapIikoStatusToLocal(info.status);
  if (info.status && info.status === order.iikoStatus && (!localStatus || localStatus === order.status)) {
    return { handled: true, reason: 'status unchanged (idempotent skip)' };
  }

  const update: Prisma.OrderUpdateInput = {
    iikoStatus: info.status || undefined,
  };
  if (localStatus && localStatus !== order.status) {
    update.status = localStatus as OrderStatus;
  }
  if (info.courierId) {
    const courier = await prisma.user.findFirst({ where: { iikoId: info.courierId } });
    if (courier && courier.id !== order.courierId) {
      update.courier = { connect: { id: courier.id } };
    }
  }

  await prisma.order.update({ where: { id: order.id }, data: update });

  if (localStatus && localStatus !== order.status) {
    notifyOrderStatus(order.id, localStatus).catch((e) =>
      console.error('[notifyOrderStatus][webhook]', e),
    );
  }

  return { handled: true, reason: `order ${order.id} updated to ${localStatus ?? info.status}` };
}
