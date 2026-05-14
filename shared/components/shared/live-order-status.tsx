'use client';

import React from 'react';
import { OrderStatus, DeliveryType } from '@prisma/client';
import { OrderStatusTracker } from './order-status-tracker';

interface Props {
  orderId: number;
  initialStatus: OrderStatus;
  initialDeliveryType?: DeliveryType;
  /** Polling interval in ms. Default 6000. */
  intervalMs?: number;
  className?: string;
}

const TERMINAL: OrderStatus[] = ['SUCCEEDED', 'CANCELLED'];

export const LiveOrderStatus: React.FC<Props> = ({
  orderId,
  initialStatus,
  initialDeliveryType,
  intervalMs = 6000,
  className,
}) => {
  const [status, setStatus] = React.useState<OrderStatus>(initialStatus);
  const [deliveryType, setDeliveryType] = React.useState<DeliveryType | undefined>(initialDeliveryType);

  React.useEffect(() => {
    if (TERMINAL.includes(status)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' });
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (cancelled) return;
        if (data?.status && data.status !== status) {
          setStatus(data.status);
        }
        if (data?.deliveryType && data.deliveryType !== deliveryType) {
          setDeliveryType(data.deliveryType);
        }
        // Stop polling once order reaches terminal state
        if (data?.status && TERMINAL.includes(data.status)) return;
      } catch {
        // ignore — retry next tick
      }
      if (!cancelled) timer = setTimeout(tick, intervalMs);
    };

    timer = setTimeout(tick, intervalMs);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, intervalMs, status, deliveryType]);

  // Re-poll when the tab becomes visible again
  React.useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !TERMINAL.includes(status)) {
        fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.status && data.status !== status) setStatus(data.status);
            if (data?.deliveryType && data.deliveryType !== deliveryType) setDeliveryType(data.deliveryType);
          })
          .catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [orderId, status, deliveryType]);

  return <OrderStatusTracker status={status} deliveryType={deliveryType} className={className} />;
};
