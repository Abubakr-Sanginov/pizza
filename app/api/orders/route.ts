import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { OrderStatus } from '@prisma/client';
import { sendEmail } from '@/back/lib/send-email';
import { OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes/order-success';
import { sendOrderNotification } from '@/bot/service';
import { sendOrderToIiko } from '@/back/services/iiko';
import { applyPromo, bumpPromoUsage } from '@/back/lib/promo';
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
      userId,
      paymentMethod,
      promoCode,
      bonusToSpend,
    } = data;

    if (!cartToken) {
      return NextResponse.json({ error: 'Cart token not found' }, { status: 400 });
    }

    
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


    if (deliveryType === 'DELIVERY' && lat && lng) {
      const stores = await prisma.store.findMany();
      if (stores.length > 0) {
        let minDistance = Infinity;
        let nearestStoreId = stores[0].id;
        const toRad = (val: number) => (val * Math.PI) / 180;

        for (const store of stores) {
          if (store.lat && store.lng) {
            const R = 6371;
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

    const settings = await prisma.setting.findFirst({ where: { id: 1 } });
    const vatPercent = settings?.vatPrice ?? 15;
    const deliveryPrice = deliveryType === 'DELIVERY' ? (settings?.deliveryPrice ?? 250) : 0;

    let promoCodeApplied: string | null = null;
    let discountAmount = 0;
    if (promoCode) {
      const promoItems = userCart.items.map((item) => {
        const ingredientsTotal = item.ingredients.reduce((s, ing) => s + ing.price, 0);
        const lineTotal = (item.productItem.price + ingredientsTotal) * item.quantity;
        return { productId: item.productItem.productId, lineTotal };
      });
      const result = await applyPromo(promoCode, userCart.totalAmount, promoItems);
      if (!('error' in result)) {
        promoCodeApplied = result.promo.code;
        discountAmount = result.discount;
      }
    }

    const vatPrice = Math.floor((userCart.totalAmount * vatPercent) / 100);
    const baseTotal = Math.max(0, userCart.totalAmount + deliveryPrice + vatPrice - discountAmount);

    // Bonus spend validation
    let bonusSpent = 0;
    if (userId && bonusToSpend && Number(bonusToSpend) > 0) {
      const { ensureBonus, BONUS_MAX_SPEND_RATE } = await import('@/back/lib/bonus');
      const bonus = await ensureBonus(Number(userId));
      const maxAllowed = Math.floor(baseTotal * BONUS_MAX_SPEND_RATE);
      bonusSpent = Math.min(Number(bonusToSpend), bonus.balance, maxAllowed);
    }
    const finalTotal = Math.max(0, baseTotal - bonusSpent);

    const method = (paymentMethod ?? 'CASH_ON_DELIVERY') as
      | 'CASH_ON_DELIVERY'
      | 'TELEGRAM_STARS'
      | 'MANUAL_TRANSFER'
      | 'ALIF_PAY'
      | 'YOOKASSA';
    const isOnlinePayment =
      method === 'TELEGRAM_STARS' ||
      method === 'MANUAL_TRANSFER' ||
      method === 'ALIF_PAY' ||
      method === 'YOOKASSA';

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
        totalAmount: finalTotal,
        discount: discountAmount,
        promoCode: promoCodeApplied,
        status: OrderStatus.PENDING,
        paymentMethod: method as any,
        paymentStatus: 'PENDING',
        items: JSON.stringify(userCart.items),
        userId: userId ? Number(userId) : null,
      },
    });

    if (promoCodeApplied) {
      bumpPromoUsage(promoCodeApplied).catch(() => {});
    }

    // Spend bonuses if requested
    if (userId && bonusSpent > 0) {
      const { spendBonus } = await import('@/back/lib/bonus');
      await spendBonus({
        userId: Number(userId),
        amount: bonusSpent,
        orderTotal: baseTotal,
        orderId: order.id,
      }).catch((e: unknown) => console.error('[API_ORDER] spendBonus failed', e));
    }

    // Accrue bonuses for cash orders
    if (userId && method === 'CASH_ON_DELIVERY') {
      const { accrueBonus } = await import('@/back/lib/bonus');
      accrueBonus({
        userId: Number(userId),
        orderTotal: finalTotal,
        orderId: order.id,
      }).catch((e: unknown) => console.error('[API_ORDER] accrueBonus failed', e));
    }

    if (!isOnlinePayment) {
      await prisma.cart.update({
        where: { id: userCart.id },
        data: { totalAmount: 0 },
      });

      await prisma.cartItem.deleteMany({
        where: { cartId: userCart.id },
      });
    }

    
    try {
      await sendEmail(
        email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items: userCart.items as any }) as React.ReactElement,
      );
    } catch (e) {
      console.log('[API_ORDER] Email failed', e);
    }

    
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

    if (!isOnlinePayment) {
      try {
        const result = await sendOrderToIiko(order, userCart.items as any);
        if (result.status === 'failed') {
          console.warn(`[API_ORDER] iiko sync failed for order ${order.id}: ${result.reason}`);
        } else if (result.status === 'skipped') {
          console.info(`[API_ORDER] iiko skipped for order ${order.id}: ${result.reason}`);
        }
      } catch (e) {
        console.error('[API_ORDER] iiko crashed', e);
      }
    }

    return NextResponse.json({ ...order, requiresOnlinePayment: isOnlinePayment });
  } catch (error) {
    console.error('[ORDER_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
