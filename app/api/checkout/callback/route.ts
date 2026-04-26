import React from 'react';
import { PaymentCallbackData } from '@/@types/yookassa';
import { prisma } from '@/back/prisma/prisma-client';
import { OrderCancelledTemplate, OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes';
import { sendEmail } from '@/back/lib/send-email';
import { CartItemDTO } from '@/back/services/dto/cart.dto';
import { OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PaymentCallbackData;

    const order = await prisma.order.findFirst({
      where: {
        id: Number(body.object.metadata.order_id),
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' });
    }

    const isSucceeded = body.object.status === 'succeeded';

    await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: isSucceeded ? OrderStatus.SUCCEEDED : OrderStatus.CANCELLED,
      },
    });

    const items = JSON.parse(order?.items as string) as CartItemDTO[];

    if (isSucceeded) {
      await sendEmail(
        order.email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items }) as React.ReactElement,
      );
    } else {
      await sendEmail(
        order.email,
        'Next Pizza / Заказ #' + order.id + ' был отменен ❌',
        OrderCancelledTemplate({ orderId: order.id }) as React.ReactElement,
      );
    }
  } catch (error) {
    console.log('[Checkout Callback] Error:', error);
    return NextResponse.json({ error: 'Server error' });
  }
}

