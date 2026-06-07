export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title, AiTranslateButton } from '@/shared/components/shared';
import { ShoppingBag, Users, Wallet, TrendingUp } from 'lucide-react';

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [globalStats, totalUsers, todayStats, recentOrders, topProducts] = await Promise.all([
    prisma.globalStat.findUnique({ where: { id: 1 } }),
    prisma.user.count(),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: today },
        status: 'SUCCEEDED',
      },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    }),
    prisma.product.findMany({
      take: 5,
      include: {
        items: true,
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: {
        reviews: { _count: 'desc' },
      },
    }),
  ]);

  const stats = [
    {
      title: 'Всего заказов (All-time)',
      value: globalStats?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Всего выручки (All-time)',
      value: `${globalStats?.totalRevenue || 0} TJS`,
      icon: Wallet,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Пользователей',
      value: totalUsers,
      icon: Users,
      color: 'text-purple-500 dark:text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Выручка за сегодня',
      value: `${todayStats._sum.totalAmount || 0} TJS`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div>
      <Title text="Панель управления" size="lg" className="font-bold" />
        <AiTranslateButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
              <stat.icon className={stat.color} size={28} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <ShoppingBag size={20} className="text-muted-foreground" />
            Последние заказы
          </h3>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-muted hover:bg-accent transition-colors">
                <div>
                  <p className="font-bold">Заказ #{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.fullName} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{order.totalAmount} TJS</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'SUCCEEDED' ? 'text-green-500 dark:text-green-400' : 'text-primary'
                  }`}>{order.status}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-muted-foreground text-center py-10">Заказов пока нет</p>}
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-muted-foreground" />
            Популярные товары (по отзывам)
          </h3>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted transition-colors">
                <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-contain" />
                <div className="flex-1">
                  <p className="font-bold text-sm">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product._count.reviews} отзывов</p>
                </div>
                <div className="text-right font-bold text-primary">
                  {product.items[0]?.price} TJS
                </div>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-muted-foreground text-center py-10">Товаров пока нет</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

