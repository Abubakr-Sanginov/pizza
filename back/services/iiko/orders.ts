import crypto from 'crypto';
import { Order, Prisma } from '@prisma/client';

import { prisma } from '@/back/prisma/prisma-client';
import { notifyOrderStatus } from '@/back/lib/notify-order-status';

import { iikoRequest, IikoError } from './client';
import { IIKO_CONFIG, isIikoEnabled } from './config';
import { parseAddress } from './address';
import { mapIikoStatusToLocal } from './status-map';

interface CartItemRecord {
  quantity: number;
  productItem: {
    iikoId: string | null;
    price: number;
  };
  ingredients: Array<{ iikoId: string | null; price: number }>;
}

interface SyncResult {
  status: 'sent' | 'skipped' | 'failed';
  iikoOrderId?: string;
  reason?: string;
}

interface OrderRoutingTargets {
  organizationId: string;
  terminalGroupId: string;
}

async function resolveTargets(order: Order): Promise<OrderRoutingTargets | null> {
  if (order.storeId) {
    const store = await prisma.store.findUnique({ where: { id: order.storeId } });
    if (store?.iikoOrganizationId && store?.iikoTerminalGroupId) {
      return {
        organizationId: store.iikoOrganizationId,
        terminalGroupId: store.iikoTerminalGroupId,
      };
    }
  }
  if (IIKO_CONFIG.defaultOrganizationId && IIKO_CONFIG.defaultTerminalGroupId) {
    return {
      organizationId: IIKO_CONFIG.defaultOrganizationId,
      terminalGroupId: IIKO_CONFIG.defaultTerminalGroupId,
    };
  }
  return null;
}

function buildPayments(totalAmount: number) {
  if (!IIKO_CONFIG.paymentTypeIdCash) return [];
  return [
    {
      paymentTypeKind: 'Cash' as const,
      sum: totalAmount,
      paymentTypeId: IIKO_CONFIG.paymentTypeIdCash,
      isProcessedExternally: false,
    },
  ];
}

function buildItems(items: CartItemRecord[]) {
  return items
    .map((item) => {
      if (!item.productItem.iikoId) return null;
      const modifiers = (item.ingredients || [])
        .filter((ing) => Boolean(ing.iikoId))
        .map((ing) => ({ productId: ing.iikoId as string, amount: 1 }));

      return {
        productId: item.productItem.iikoId,
        type: 'Product' as const,
        amount: item.quantity,
        ...(modifiers.length ? { modifiers } : {}),
      };
    })
    .filter(<T>(v: T | null): v is T => v !== null);
}

function buildDeliveryPoint(order: Order) {
  if (order.deliveryType === 'PICKUP') return undefined;
  const { streetName, house } = parseAddress(order.address);
  return {
    address: {
      street: { name: streetName },
      house: house || '1',
      flat: order.apartment || '',
      entrance: order.entrance || '',
      floor: order.floor || '',
      doorphone: order.doorCode || '',
    },
    coordinates: order.lat && order.lng ? { latitude: order.lat, longitude: order.lng } : undefined,
  };
}

export async function sendOrderToIiko(
  order: Order,
  cartItems: CartItemRecord[],
): Promise<SyncResult> {
  if (!isIikoEnabled()) {
    return { status: 'skipped', reason: 'iiko disabled (no IIKO_API_LOGIN)' };
  }

  const targets = await resolveTargets(order);
  if (!targets) {
    return { status: 'skipped', reason: 'no organization/terminal mapping for store' };
  }

  const items = buildItems(cartItems);
  if (items.length === 0) {
    // FIX: записываем в БД, чтобы retry-воркер подхватил после синхронизации меню
    await prisma.order.update({
      where: { id: order.id },
      data: {
        iikoSyncAttempts: { increment: 1 },
        iikoSyncError: 'no items have iikoId — sync menu first',
      },
    });
    return { status: 'skipped', reason: 'no items have iikoId — sync menu first' };
  }

  const correlationId = order.iikoCorrelationId || crypto.randomUUID();
  if (!order.iikoCorrelationId) {
    await prisma.order.update({
      where: { id: order.id },
      data: { iikoCorrelationId: correlationId },
    });
  }

  const isPickup = order.deliveryType === 'PICKUP';
  const path = isPickup ? '/deliveries/createPickup' : '/deliveries/create';

  const payload: Record<string, unknown> = {
    organizationId: targets.organizationId,
    terminalGroupId: targets.terminalGroupId,
    order: {
      id: correlationId,
      externalNumber: String(order.id),
      phone: order.phone,
      customer: { name: order.fullName, type: 'one-time' as const },
      comment: order.comment || '',
      items,
      payments: buildPayments(order.totalAmount),
      ...(isPickup ? {} : { deliveryPoint: buildDeliveryPoint(order) }),
    },
  };

  try {
    const data = await iikoRequest<{ orderInfo?: { id?: string }; correlationId?: string }>(path, payload);
    const iikoOrderId = data?.orderInfo?.id;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        iikoOrderId: iikoOrderId || null,
        iikoSyncedAt: new Date(),
        iikoSyncError: null,
        iikoSyncAttempts: { increment: 1 },
      },
    });

    return { status: 'sent', iikoOrderId };
  } catch (e: any) {
    const message = e instanceof IikoError ? e.message : (e?.message ?? 'unknown error');
    await prisma.order.update({
      where: { id: order.id },
      data: {
        iikoSyncError: message.slice(0, 500),
        iikoSyncAttempts: { increment: 1 },
      },
    });
    return { status: 'failed', reason: message };
  }
}

export async function getOrderStatusFromIiko(
  organizationId: string,
  iikoOrderId: string,
): Promise<{ iikoStatus: string | null; courierIikoId: string | null }> {
  const data = await iikoRequest<{
    orders?: Array<{ id: string; creationStatus?: string; order?: { status?: string; courierInfo?: { courier?: { id?: string } } } }>;
  }>('/deliveries/by_id', { organizationId, orderIds: [iikoOrderId] });

  const order = data?.orders?.[0];
  if (!order) return { iikoStatus: null, courierIikoId: null };
  const iikoStatus = order.order?.status ?? order.creationStatus ?? null;
  const courierIikoId = order.order?.courierInfo?.courier?.id ?? null;
  return { iikoStatus, courierIikoId };
}

export async function pollPendingOrders(limit = 50): Promise<{ checked: number; updated: number; failed: number }> {
  if (!isIikoEnabled()) return { checked: 0, updated: 0, failed: 0 };

  const orders = await prisma.order.findMany({
    where: {
      iikoOrderId: { not: null },
      status: { in: ['PENDING', 'COOKING', 'READY', 'DELIVERING'] },
    },
    orderBy: { updatedAt: 'asc' },
    take: limit,
    include: { store: true },
  });

  let updated = 0;
  let failed = 0;

  for (const order of orders) {
    if (!order.iikoOrderId) continue;
    const orgId = order.store?.iikoOrganizationId || IIKO_CONFIG.defaultOrganizationId;
    if (!orgId) continue;

    try {
      const { iikoStatus, courierIikoId } = await getOrderStatusFromIiko(orgId, order.iikoOrderId);
      const localStatus = mapIikoStatusToLocal(iikoStatus);
      const updateData: Prisma.OrderUpdateInput = {
        iikoStatus: iikoStatus || undefined,
      };
      if (localStatus && localStatus !== order.status) {
        updateData.status = localStatus;
      }
      if (courierIikoId) {
        const courier = await prisma.user.findFirst({ where: { iikoId: courierIikoId } });
        if (courier && courier.id !== order.courierId) {
          updateData.courier = { connect: { id: courier.id } };
        }
      }
      await prisma.order.update({ where: { id: order.id }, data: updateData });
      if (localStatus && localStatus !== order.status) {
        updated++;
        notifyOrderStatus(order.id, localStatus).catch((e) =>
          console.error('[notifyOrderStatus][poll]', e),
        );
      }
    } catch (e) {
      failed++;
      console.error(`[IIKO POLL] order ${order.id} failed:`, e);
    }
  }

  return { checked: orders.length, updated, failed };
}

export async function retryFailedOrders(limit = 20): Promise<{ retried: number; sent: number }> {
  if (!isIikoEnabled()) return { retried: 0, sent: 0 };

  const orders = await prisma.order.findMany({
    where: {
      iikoOrderId: null,
      iikoSyncError: { not: null },
      iikoSyncAttempts: { lt: 5 },
      // FIX: только оплаченные заказы — не отправлять неоплаченные в iiko
      paymentStatus: 'PAID',
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  let sent = 0;
  for (const order of orders) {
    // FIX: безопасный парсинг — при ошибке пишем в БД, чтобы не было бесконечной петли
    let cartItems: CartItemRecord[];
    try {
      cartItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items as any);
    } catch {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          iikoSyncAttempts: { increment: 1 },
          iikoSyncError: 'Failed to parse order items JSON',
        },
      });
      console.error(`[IIKO RETRY] order ${order.id}: invalid items JSON`);
      continue;
    }
    const result = await sendOrderToIiko(order, cartItems);
    if (result.status === 'sent') sent++;
    else if (result.status === 'failed') {
      console.warn(`[IIKO RETRY] order ${order.id} failed: ${result.reason}`);
    }
  }
  return { retried: orders.length, sent };
}
