import { prisma } from '@/back/prisma/prisma-client';
import { Title, Container, DeleteButton, EmptyState, LiveOrderStatus, LocalTime } from '@/shared/components/shared';
import { RepeatOrderButton } from '@/shared/components/shared/repeat-order-button';
import { getUserSession } from '@/back/lib/get-user-session';
import { redirect } from 'next/navigation';
import { OrderStatus } from '@prisma/client';
import Link from 'next/link';
import { deleteOrder } from '@/back/actions/order-actions';
import { revalidatePath } from 'next/cache';
import { Package } from 'lucide-react';

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
          <EmptyState
            icon={Package}
            iconAccent="primary"
            title="У вас пока нет заказов"
            description="Когда вы оформите первый заказ — он появится здесь. Можно будет повторить заказ в один клик."
            actionLabel="Перейти к меню"
            actionHref="/"
          />
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
                    <LocalTime
                      date={order.createdAt.toISOString()}
                      format="datetime"
                      className="text-muted-foreground text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-3 md:gap-6 flex-wrap">
                    <div className="text-xl font-bold">{order.totalAmount} TJS</div>
                    <RepeatOrderButton orderId={order.id} className="h-9 px-3 text-sm rounded-xl" />
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

                <div className="mt-5 pt-5 border-t border-border">
                  <LiveOrderStatus
                    orderId={order.id}
                    initialStatus={order.status}
                    initialDeliveryType={order.deliveryType}
                  />
                </div>

                {willAutoDelete && (
                  <div className="mt-3 text-xs text-muted-foreground">
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
