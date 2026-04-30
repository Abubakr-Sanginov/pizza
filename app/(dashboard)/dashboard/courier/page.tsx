import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { getUserSession } from '@/back/lib/get-user-session';
import { redirect } from 'next/navigation';
import { OrderStatusSelector } from '../orders/components/order-status-selector';

export default async function CourierDashboardPage() {
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
      <Title text="Мои доставки" size="lg" className="font-bold mb-10" />

      <div className="grid grid-cols-1 gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-2xl border shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-lg text-primary">Заказ #{order.id}</span>
                <span className="text-gray-500 text-sm">| {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-semibold">Адрес:</span> {order.address || 'Не указан'}</p>
                {order.entrance && <p><span className="font-semibold">Подъезд:</span> {order.entrance}</p>}
                {order.floor && <p><span className="font-semibold">Этаж:</span> {order.floor}</p>}
                {order.apartment && <p><span className="font-semibold">Кв/Офис:</span> {order.apartment}</p>}
                <p><span className="font-semibold">Клиент:</span> {order.fullName}</p>
                <p><span className="font-semibold">Тел:</span> {order.phone}</p>
                {order.comment && <p className="mt-2 p-2 bg-gray-50 rounded italic text-gray-500">"{order.comment}"</p>}
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
          <div className="text-center py-20 bg-white rounded-2xl border shadow-sm text-gray-500">
             <p className="text-lg">У вас пока нет активных доставок.</p>
             <p className="text-sm">Ожидайте назначения новых заказов.</p>
          </div>
        )}
      </div>
    </div>
  );
}
