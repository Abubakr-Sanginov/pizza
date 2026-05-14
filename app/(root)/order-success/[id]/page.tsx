import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Package, Home } from 'lucide-react';

import { prisma } from '@/back/prisma/prisma-client';
import { Container, Confetti, OrderStatusTracker } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';

interface PageProps {
  params: { id: string };
}

export default async function OrderSuccessPage({ params }: PageProps) {
  const orderId = Number(params.id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    redirect('/');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    redirect('/');
  }

  const etaMin = order.deliveryType === 'PICKUP' ? 20 : 45;

  return (
    <>
      <Confetti />
      <Container className="mt-10 md:mt-16 mb-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-emerald-500/25 to-green-500/15 ring-4 ring-emerald-500/20 flex items-center justify-center shadow-soft-lg">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" strokeWidth={2.4} />
            </div>
            <span className="absolute -inset-2 rounded-[32px] ring-2 ring-emerald-500/20 animate-ping" />
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] mb-3">
            Заказ оформлен!{' '}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              Спасибо
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8">
            Мы уже взялись за приготовление. Скоро всё будет горячее, обещаем.
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-10">
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">№ заказа</div>
              <div className="text-2xl font-black mt-1">#{order.id}</div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Сумма</div>
              <div className="text-2xl font-black mt-1">{order.totalAmount}<span className="text-sm text-muted-foreground"> TJS</span></div>
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                {order.deliveryType === 'PICKUP' ? 'Готово через' : 'Доставка'}
              </div>
              <div className="text-2xl font-black mt-1">~{etaMin}<span className="text-sm text-muted-foreground"> мин</span></div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 md:p-7 mb-8">
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4 text-left">
              Этапы заказа
            </div>
            <OrderStatusTracker status={order.status} deliveryType={order.deliveryType} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/profile/orders">
              <Button size="lg" className="btn-gradient border-0 h-12 px-7 rounded-2xl font-extrabold gap-2 w-full sm:w-auto">
                <Package size={18} />
                Мои заказы
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="h-12 px-7 rounded-2xl font-extrabold gap-2 w-full sm:w-auto">
                <Home size={18} />
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </>
  );
}
