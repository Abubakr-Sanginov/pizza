import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { signOrder } from '@/back/lib/payment-token';

export async function POST(req: NextRequest) {
  const { orderId, method } = await req.json();

  if (!orderId || (method !== 'STARS' && method !== 'TRANSFER')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const dbMethod = method === 'STARS' ? 'TELEGRAM_STARS' : 'MANUAL_TRANSFER';
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentMethod: dbMethod as any, paymentStatus: 'PENDING' },
  });

  const token = signOrder(order.id, method);
  const botUsername = process.env.PAYMENTS_BOT_USERNAME?.replace(/^@/, '').trim();

  if (!botUsername) {
    return NextResponse.json(
      { error: 'PAYMENTS_BOT_USERNAME не задан в .env' },
      { status: 500 },
    );
  }

  const deepLink = `https://t.me/${botUsername}?start=${token}`;
  return NextResponse.json({ deepLink, token, botUsername });
}
