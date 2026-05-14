import React, { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { OrderStatusTracker } from './OrderStatusTracker';
import { BASE_URL } from '@/constants/Api';

type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'DELIVERING' | 'SUCCEEDED' | 'CANCELLED';
type DeliveryType = 'DELIVERY' | 'PICKUP';

const TERMINAL: OrderStatus[] = ['SUCCEEDED', 'CANCELLED'];

interface Props {
  orderId: number;
  initialStatus: OrderStatus;
  initialDeliveryType?: DeliveryType;
  intervalMs?: number;
}

export const LiveOrderStatus: React.FC<Props> = ({
  orderId,
  initialStatus,
  initialDeliveryType,
  intervalMs = 6000,
}) => {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [deliveryType, setDeliveryType] = useState<DeliveryType | undefined>(initialDeliveryType);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    if (TERMINAL.includes(status)) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/orders/${orderId}/status`);
        if (!res.ok) throw new Error('fail');
        const data = await res.json();
        if (cancelled.current) return;
        if (data?.status && data.status !== status) setStatus(data.status);
        if (data?.deliveryType && data.deliveryType !== deliveryType) setDeliveryType(data.deliveryType);
        if (data?.status && TERMINAL.includes(data.status)) return;
      } catch {}
      if (!cancelled.current) timer = setTimeout(tick, intervalMs);
    };
    timer = setTimeout(tick, intervalMs);

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active' && !TERMINAL.includes(status)) {
        fetch(`${BASE_URL}/api/orders/${orderId}/status`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (!data) return;
            if (data.status && data.status !== status) setStatus(data.status);
            if (data.deliveryType && data.deliveryType !== deliveryType) setDeliveryType(data.deliveryType);
          })
          .catch(() => {});
      }
    });

    return () => {
      cancelled.current = true;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [orderId, intervalMs, status, deliveryType]);

  return <OrderStatusTracker status={status} deliveryType={deliveryType} />;
};
