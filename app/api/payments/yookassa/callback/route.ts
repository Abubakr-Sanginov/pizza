import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { yookassaConfigured } from '@/back/services/yookassa';
import { settleYooKassaCanceled, settleYooKassaSucceeded } from '@/back/lib/yookassa-settle';

export async function GET() {
  return NextResponse.json({ ok: true, service: 'yookassa-callback' });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 });
  }

  console.log('[YooKassa callback]', body);

  if (!yookassaConfigured) {
    return NextResponse.json({ error: 'YooKassa not configured' }, { status: 500 });
  }

  const event = body.event;
  const payment = body.object;

  if (!event || !payment) {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const orderId = payment.metadata?.orderId;
  if (!orderId) {
    return NextResponse.json({ error: 'No orderId in metadata' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  if (event === 'payment.succeeded') {
    await settleYooKassaSucceeded(order.id, payment.id, 'yookassa-webhook');
  } else if (event === 'payment.canceled') {
    await settleYooKassaCanceled(order.id);
  }

  return NextResponse.json({ ok: true });
}
