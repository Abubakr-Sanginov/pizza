import { Container, Title, LocalTime } from '@/shared/components/shared';
import { prisma } from '@/back/prisma/prisma-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Уведомления | Next Pizza',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NotificationsPage() {
  const notifications = await prisma.notification.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <Container className="my-10">
      <Title text="Уведомления" size="lg" className="font-bold mb-10" />

      <div className="flex flex-col gap-5 max-w-[800px] mx-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-card text-card-foreground rounded-3xl border border-dashed border-border text-muted-foreground">
            У вас пока нет уведомлений
          </div>
        ) : (
          notifications.map((item) => (
            <div key={item.id} className="bg-card text-card-foreground p-6 rounded-3xl shadow-sm border border-border flex gap-6">
              {item.imageUrl && (
                <div className="w-24 h-24 flex-shrink-0">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold">{item.title}</h3>
                  <LocalTime
                    date={item.createdAt.toISOString()}
                    format="datetime"
                    className="text-sm text-muted-foreground"
                  />
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Container>
  );
}
