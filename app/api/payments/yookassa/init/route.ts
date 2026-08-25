import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { createYooKassaPayment, yookassaMockMode } from '@/back/services/yookassa';

export async function POST(req: NextRequest) {
  const { orderId } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: 'YOOKASSA' as any,
      paymentStatus: 'PENDING',
      paymentProvider: yookassaMockMode ? 'YOOKASSA_MOCK' : 'YOOKASSA',
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const returnUrl = `${siteUrl}/order-success/${order.id}`;

  const result = await createYooKassaPayment({
    amount: order.totalAmount,
    description: `Заказ #${order.id} в Next Pizza`,
    confirmationUrl: returnUrl,
    metadata: { orderId: order.id },
  });

  const confirmationUrl = result.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return NextResponse.json(
      { error: 'YooKassa не вернула ссылку для оплаты' },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: result.id },
  });

  return NextResponse.json({ url: confirmationUrl, mock: yookassaMockMode });
}
