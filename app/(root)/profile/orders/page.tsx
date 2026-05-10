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
  PENDING: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300',
  COOKING: 'bg-orange-500/15 text-orange-800 dark:text-orange-300',
  READY: 'bg-blue-500/15 text-blue-800 dark:text-blue-300',
  DELIVERING: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300',
  SUCCEEDED: 'bg-green-500/15 text-green-800 dark:text-green-300',
  CANCELLED: 'bg-red-500/15 text-red-800 dark:text-red-300',
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
          <div className="text-center py-20 text-muted-foreground bg-card rounded-2xl border border-border shadow-sm">
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
              <div key={order.id} className="bg-card text-card-foreground p-4 md:p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <div className="font-bold text-lg mb-1">Заказ #{order.id}</div>
                    <div className="text-muted-foreground text-sm">
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
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 h-auto"
                      />
                    )}
                  </div>
                </div>

                {willAutoDelete && (
                  <div className="mt-2 text-xs text-muted-foreground">
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
