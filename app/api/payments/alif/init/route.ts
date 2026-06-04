import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { initAlifPayment, alifConfigured } from '@/back/services/alif';

export async function POST(req: NextRequest) {
  if (!alifConfigured) {
    return NextResponse.json({ error: 'Alif не настроен (ALIF_TERMINAL_ID / ALIF_TERMINAL_PASSWORD)' }, { status: 500 });
  }

  const { orderId } = await req.json();
  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentMethod: 'ALIF_PAY' as any, paymentStatus: 'PENDING', paymentProvider: 'ALIF' },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const result = await initAlifPayment({
    orderId: `ORDER_${order.id}_${Date.now()}`,
    amount: order.totalAmount,
    callbackUrl: `${siteUrl}/api/payments/alif/callback`,
    returnUrl: `${siteUrl}/order-success/${order.id}`,
    info: `Заказ #${order.id} в Next Pizza`,
    email: order.email,
    phone: order.phone,
  });

  if (result.code !== 200 || !result.url) {
    return NextResponse.json({ error: result.message || 'Alif init failed' }, { status: 502 });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentRef: result.url },
  });

  return NextResponse.json({ url: result.url });
}
