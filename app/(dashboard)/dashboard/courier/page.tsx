export const dynamic = 'force-dynamic';

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { getUserSession } from '@/back/lib/get-user-session';
import { redirect } from 'next/navigation';
import { OrderStatusSelector } from '../orders/components/order-status-selector';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function CourierDashboardPage() {
  const t = getAdminT();
  const session = await getUserSession();

  if (!session || session.role !== 'COURIER') {
    return redirect('/');
  }

  const orders = await prisma.order.findMany({
    where: {
      courierId: Number(session.id),
      status: {
        in: ['READY', 'DELIVERING', 'SUCCEEDED', 'CANCELLED'],
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  return (
    <div className="p-4 md:p-10">
      <Title text={t('admin.courier.title')} size="lg" className="font-bold mb-10" />

      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg text-primary">{t('admin.courier.order')} #{order.id}</span>
                <span className="text-muted-foreground text-sm">| {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-semibold">{t('admin.courier.address')}</span> {order.address || t('admin.courier.notSpecified')}</p>
                {order.entrance && <p><span className="font-semibold">{t('admin.courier.entrance')}</span> {order.entrance}</p>}
                {order.floor && <p><span className="font-semibold">{t('admin.courier.floor')}</span> {order.floor}</p>}
                {order.apartment && <p><span className="font-semibold">{t('admin.courier.apartment')}</span> {order.apartment}</p>}
                <p><span className="font-semibold">{t('admin.courier.client')}</span> {order.fullName}</p>
                <p><span className="font-semibold">{t('admin.courier.phone')}</span> {order.phone}</p>
                {order.comment && <p className="mt-2 p-2 bg-muted rounded italic text-muted-foreground">&quot;{order.comment}&quot;</p>}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="text-xl font-bold mb-2">{order.totalAmount} TJS</div>
              <OrderStatusSelector
                orderId={order.id}
                initialStatus={order.status}
              />
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-20 bg-card text-card-foreground rounded-2xl border border-border shadow-sm text-muted-foreground">
             <p className="text-lg">{t('admin.courier.emptyTitle')}</p>
             <p className="text-sm">{t('admin.courier.emptyText')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
