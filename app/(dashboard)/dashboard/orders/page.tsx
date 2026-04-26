import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { OrderStatusSelector } from './components/order-status-selector';
import { deleteOrder } from '@/back/actions/order-actions';
import { revalidatePath } from 'next/cache';
import { Button } from '@/shared/components/ui';
import { Trash2 } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/delete-button';

export default async function DashboardOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: true,
    },
  });

  const onDelete = async (id: number) => {
    'use server';
    await deleteOrder(id);
    revalidatePath('/dashboard/orders');
  };

  return (
    <div>
      <Title text="Управление заказами" size="lg" className="font-bold mb-10" />

      <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">ID Заказа</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Клиент</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Сумма</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Дата</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Статус</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b hover:bg-gray-50/50">
                <td className="px-6 py-4 font-medium">#{order.id}</td>
                <td className="px-6 py-4">
                  <div>{order.fullName}</div>
                  <div className="text-gray-500 text-xs">{order.phone}</div>
                </td>
                <td className="px-6 py-4 font-medium">{order.totalAmount} TJS</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(order.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="px-6 py-4">
                  <OrderStatusSelector orderId={order.id} initialStatus={order.status} />
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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
