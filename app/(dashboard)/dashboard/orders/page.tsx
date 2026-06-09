export const dynamic = 'force-dynamic';

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { OrderStatusSelector } from './components/order-status-selector';
import { CourierSelector } from './components/courier-selector';
import { deleteOrder } from '@/back/actions/order-actions';
import { revalidatePath } from 'next/cache';
import { DeleteButton } from '@/shared/components/shared/delete-button';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function DashboardOrdersPage() {
  const t = getAdminT();
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
      <Title text={t('admin.orders.title')} size="lg" className="font-bold mb-10" />

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.orders.orderId')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.orders.client')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.orders.amount')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.orders.status')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.orders.courier')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground text-right">{t('admin.common.actions')}</th>
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
                  {t('admin.orders.noOrders')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
