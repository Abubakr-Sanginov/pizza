import { prisma } from '@/back/prisma/prisma-client';
import { Title, Container, DeleteButton } from '@/shared/components/shared';
import { getUserSession } from '@/back/lib/get-user-session';
import { redirect } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import Link from 'next/link';
import { deleteOrder } from '@/back/actions/order-actions';
import { revalidatePath } from 'next/cache';

const statusTranslations: Record<OrderStatus, string> = {
  PENDING: 'В ожидании',
  COOKING: 'Готовится',
  READY: 'Готов',
  DELIVERING: 'В доставке',
  SUCCEEDED: 'Выполнен',
  CANCELLED: 'Отменен',
};

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  COOKING: 'bg-orange-100 text-orange-800',
  READY: 'bg-blue-100 text-blue-800',
  DELIVERING: 'bg-indigo-100 text-indigo-800',
  SUCCEEDED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default async function UserOrdersPage() {
  const session = await getUserSession();

  if (!session) {
    return redirect('/not-auth');
  }

  const orders = await prisma.order.findMany({
    where: {
      userId: Number(session.id),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const onDelete = async (orderId: number) => {
    'use server';
    await deleteOrder(orderId);
    revalidatePath('/profile/orders');
  };

  return (
    <Container className="mt-10 mb-20">
      <div className="flex items-center justify-between mb-8">
        <Title text="Мои заказы" size="md" className="font-bold" />
        <Link href="/profile" className="text-primary hover:underline font-medium">
          Вернуться в профиль
        </Link>
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border shadow-sm">
            У вас пока нет заказов
          </div>
        ) : (
          orders.map((order) => {
            const canDelete = order.status === OrderStatus.CANCELLED;
            const isCompleted = order.status === OrderStatus.SUCCEEDED;
            const updatedAt = new Date(order.updatedAt);
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const willAutoDelete = (isCompleted || canDelete) && updatedAt < oneDayAgo;

            return (
              <div key={order.id} className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="font-bold text-lg mb-1">Заказ #{order.id}</div>
                    <div className="text-gray-500 text-sm">
                      {new Date(order.createdAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="text-xl font-bold">{order.totalAmount} TJS</div>
                    <div className={`px-4 py-1.5 rounded-full text-sm font-semibold ${statusColors[order.status]}`}>
                      {statusTranslations[order.status]}
                    </div>
                    {canDelete && (
                      <DeleteButton
                        onDelete={async () => {
                          'use server';
                          await deleteOrder(order.id);
                          revalidatePath('/profile/orders');
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 h-auto"
                      />
                    )}
                  </div>
                </div>

                {willAutoDelete && (
                  <div className="mt-2 text-xs text-gray-400">
                    Этот заказ будет автоматически удалён в ближайшее время
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Container>
  );
}
