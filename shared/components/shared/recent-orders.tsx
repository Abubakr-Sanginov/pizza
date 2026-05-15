import React from 'react';
import { Title } from './title';
import { prisma } from '@/back/prisma/prisma-client';
import { ShoppingBag } from 'lucide-react';
import { LocalTime } from './local-time';

interface Props {
  className?: string;
}

function safeFirstProductName(itemsRaw: unknown): string | null {
  try {
    const items = typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : itemsRaw;
    return items?.[0]?.productItem?.product?.name ?? null;
  } catch {
    return null;
  }
}

export const RecentOrders: React.FC<Props> = async ({ className }) => {
  let orders: Awaited<ReturnType<typeof prisma.order.findMany>> = [];
  try {
    orders = await prisma.order.findMany({
      where: { status: 'SUCCEEDED' },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  } catch (e) {
    console.error('[RecentOrders] DB query failed', e);
    return null;
  }

  if (orders.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Title text="Сейчас заказывают" size="sm" className="font-bold mb-4 flex items-center gap-2">
        <ShoppingBag size={18} className="text-primary" />
        Активность
      </Title>
      <div className="flex flex-col gap-3">
        {orders.map((order, i) => {
          const productName = safeFirstProductName(order.items);
          if (!productName) return null;
          const firstName = order.fullName?.split(' ')[0] ?? 'Гость';
          return (
            <div
              key={order.id}
              className="bg-card text-card-foreground p-3 rounded-xl border border-border shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {firstName} купил {productName}
                </span>
                <LocalTime
                  date={order.createdAt.toISOString()}
                  format="time"
                  className="text-xs text-muted-foreground"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
