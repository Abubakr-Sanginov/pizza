import React from 'react';
import { Title } from './title';
import { prisma } from '@/back/prisma/prisma-client';
import { ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  className?: string;
}

export const RecentOrders: React.FC<Props> = async ({ className }) => {
  const orders = await prisma.order.findMany({
    where: {
      status: 'SUCCEEDED',
    },
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

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
          const items = JSON.parse(order.items as string);
          const firstItem = items[0];
          return (
            <div 
              key={order.id} 
              className="bg-card text-card-foreground p-3 rounded-xl border border-border shadow-sm flex items-center gap-3 animate-in fade-in slide-in-from-right-5 duration-500"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium truncate">
                  {order.fullName.split(' ')[0]} купил {firstItem.productItem.product.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
