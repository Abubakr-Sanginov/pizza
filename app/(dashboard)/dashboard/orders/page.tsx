export const dynamic = 'force-dynamic';

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { OrderStatusSelector } from './components/order-status-selector';
import { CourierSelector } from './components/courier-selector';
import { deleteOrder } from '@/back/actions/order-actions';
import { revalidatePath } from 'next/cache';
import { DeleteButton } from '@/shared/components/shared/delete-button';

export default async function DashboardOrdersPage() {
  const [orders, couriers] = await Promise.all([
    prisma.order.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: true,
      },
    }),
    prisma.user.findMany({
      where: { role: 'COURIER' },
      select: { id: true, fullName: true },
    }),
  ]);

  return (
    <div>
      <Title text="Управление заказами" size="lg" className="font-bold mb-10" />

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground">ID Заказа</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Клиент</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Сумма</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Статус</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">Курьер</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-4 font-medium">#{order.id}</td>
                <td className="px-6 py-4">
                  <div>{order.fullName}</div>
                  <div className="text-muted-foreground text-xs">{order.phone}</div>
                </td>
                <td className="px-6 py-4 font-medium">{order.totalAmount} TJS</td>
                <td className="px-6 py-4">
                  <OrderStatusSelector orderId={order.id} initialStatus={order.status} />
                </td>
                <td className="px-6 py-4">
                  <CourierSelector
                    orderId={order.id}
                    couriers={couriers}
                    initialCourierId={order.courierId}
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  {order.status === 'CANCELLED' && (
                    <DeleteButton
                      onDelete={async () => {
                        'use server';
                        await deleteOrder(order.id);
                        revalidatePath('/dashboard/orders');
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                  Заказов пока нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
