import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { OrderStatus } from '@prisma/client';
import { sendEmail } from '@/back/lib/send-email';
import { OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes/order-success';
import { sendOrderNotification } from '@/bot/service';
import { IikoService } from '@/back/services/iiko-service';
import React from 'react';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      cartToken, 
      fullName, 
      email, 
      phone, 
      address, 
      apartment, 
      entrance, 
      floor, 
      doorCode, 
      deliveryType, 
      storeId, 
      comment, 
      lat, 
      lng,
      userId 
    } = data;

    if (!cartToken) {
      return NextResponse.json({ error: 'Cart token not found' }, { status: 400 });
    }

    /* Находим корзину по токену */
    const userCart = await prisma.cart.findFirst({
      include: {
        items: {
          include: {
            ingredients: true,
            productItem: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      where: {
        token: cartToken,
      },
    });

    if (!userCart || userCart.totalAmount === 0) {
      return NextResponse.json({ error: 'Cart is empty or not found' }, { status: 400 });
    }

    let finalStoreId = storeId;

    // Если это доставка и есть координаты, находим ближайший ресторан
    if (deliveryType === 'DELIVERY' && lat && lng) {
      const stores = await prisma.store.findMany();
      if (stores.length > 0) {
        let minDistance = Infinity;
        let nearestStoreId = stores[0].id;
        const toRad = (val: number) => (val * Math.PI) / 180;

        for (const store of stores) {
          if (store.lat && store.lng) {
            const R = 6371; // км
            const dLat = toRad(store.lat - lat);
            const dLon = toRad(store.lng - lng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat)) * Math.cos(toRad(store.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;

            if (distance < minDistance) {
              minDistance = distance;
              nearestStoreId = store.id;
            }
          }
        }
        finalStoreId = nearestStoreId;
      }
    }

    /* Создаем заказ */
    const order = await prisma.order.create({
      data: {
        token: cartToken,
        fullName,
        email,
        phone,
        address: deliveryType === 'PICKUP' ? 'Самовывоз' : address || '',
        entrance,
        floor,
        doorCode,
        apartment,
        deliveryType,
        storeId: finalStoreId,
        comment,
        lat,
        lng,
        totalAmount: userCart.totalAmount,
        status: OrderStatus.PENDING,
        items: JSON.stringify(userCart.items),
        userId: userId ? Number(userId) : null,
      },
    });

    /* Очищаем корзину */
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { totalAmount: 0 },
    });

    await prisma.cartItem.deleteMany({
      where: { cartId: userCart.id },
    });

    /* Отправка email */
    try {
      await sendEmail(
        email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items: userCart.items as any }) as React.ReactElement,
      );
    } catch (e) {
      console.log('[API_ORDER] Email failed', e);
    }

    /* Телеграм уведомление */
    try {
      await sendOrderNotification(
        order.id,
        order.totalAmount,
        order.fullName,
        order.phone,
        order.address || '',
        userCart.items,
        order.storeId,
        { entrance, floor, doorCode, apartment }
      );
    } catch (e) {
      console.log('[API_ORDER] Telegram failed', e);
    }

    /* iiko Sync */
    try {
      const iikoResult = await IikoService.syncOrderToIiko(order, userCart.items);
      if (iikoResult) {
        await prisma.order.update({
          where: { id: order.id },
          data: { iikoOrderId: iikoResult.order?.id }
        });
      }
    } catch (e) {
      console.log('[API_ORDER] iiko failed', e);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('[ORDER_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
