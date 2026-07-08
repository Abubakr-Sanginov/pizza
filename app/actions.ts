'use server';

import React from 'react';
import { prisma } from '@/back/prisma/prisma-client';
import { OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes/order-success';
import { VerificationUserTemplate } from '@/shared/components/shared/email-temapltes/verification-user';
import { CheckoutFormValues } from '@/shared/constants';
import { sendEmail } from '@/back/lib/send-email';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus, Prisma } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { sendOrderNotification } from '@/bot/service';
import { sendOrderToIiko } from '@/back/services/iiko';
import { applyPromo, bumpPromoUsage } from '@/back/lib/promo';
import { accrueBonus, spendBonus, BONUS_MAX_SPEND_RATE } from '@/back/lib/bonus';

export async function createOrder(data: CheckoutFormValues) {
  try {
    const cookieStore = cookies();
    const cartToken = cookieStore.get('cartToken')?.value;

    if (!cartToken) {
      throw new Error('Cart token not found');
    }

    
    const userCart = await prisma.cart.findFirst({
      include: {
        user: true,
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

    
    if (!userCart) {
      throw new Error('Cart not found');
    }

    
    if (userCart?.totalAmount === 0) {
      throw new Error('Cart is empty');
    }

    const currentUser = await getUserSession();

    let finalStoreId = data.storeId;


    if (data.deliveryType === 'DELIVERY' && data.lat && data.lng) {
      const stores = await prisma.store.findMany();
      if (stores.length > 0) {
        let minDistance = Infinity;
        let nearestStoreId = stores[0].id;

        const toRad = (val: number) => (val * Math.PI) / 180;

        for (const store of stores) {
          if (store.lat && store.lng) {
            const R = 6371;
            const dLat = toRad(store.lat - data.lat);
            const dLon = toRad(store.lng - data.lng);
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(data.lat)) * Math.cos(toRad(store.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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
    const deliveryPrice = data.deliveryType === 'DELIVERY' ? (settings?.deliveryPrice ?? 250) : 0;

    
    let promoCodeApplied: string | null = null;
    let discountAmount = 0;
    if (data.promoCode) {
      const promoItems = userCart.items.map((item) => {
        const ingredientsTotal = item.ingredients.reduce((s, ing) => s + ing.price, 0);
        const lineTotal = (item.productItem.price + ingredientsTotal) * item.quantity;
        return {
          productId: item.productItem.productId,
          lineTotal,
        };
      });
      const result = await applyPromo(data.promoCode, userCart.totalAmount, promoItems);
      if (!('error' in result)) {
        promoCodeApplied = result.promo.code;
        discountAmount = result.discount;
      }
    }

    const vatPrice = Math.floor((userCart.totalAmount * vatPercent) / 100);
    const baseTotal = Math.max(0, userCart.totalAmount + deliveryPrice + vatPrice - discountAmount);

    let bonusSpent = 0;
    if (currentUser && data.bonusToSpend && data.bonusToSpend > 0) {
      const userId = Number(currentUser.id);
      const bonus = await prisma.userBonus.findUnique({ where: { userId } });
      if (bonus) {
        const maxAllowed = Math.floor(baseTotal * BONUS_MAX_SPEND_RATE);
        bonusSpent = Math.min(data.bonusToSpend, bonus.balance, maxAllowed);
      }
    }
    const finalTotal = Math.max(0, baseTotal - bonusSpent);

    
    const order = await prisma.order.create({
      data: {
        token: cartToken,
        fullName: data.firstName + ' ' + data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.deliveryType === 'PICKUP' ? 'Самовывоз' : data.address || '',
        entrance: data.entrance,
        floor: data.floor,
        doorCode: data.doorCode,
        apartment: data.apartment,
        deliveryType: data.deliveryType,
        storeId: finalStoreId,
        comment: data.comment,
        lat: data.lat,
        lng: data.lng,
        totalAmount: finalTotal,
        discount: discountAmount,
        promoCode: promoCodeApplied,
        status: OrderStatus.PENDING,
        scheduledAt: data.scheduledAt
          ? (() => { const [h, m] = data.scheduledAt!.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d; })()
          : null,
        paymentMethod: (data.paymentMethod ?? 'CASH_ON_DELIVERY') as any,
        paymentStatus: 'PENDING',
        items: JSON.stringify(userCart.items),
        userId: currentUser ? Number(currentUser.id) : null,
      },
    });

    if (promoCodeApplied) {
      bumpPromoUsage(promoCodeApplied).catch(() => {});
    }

    if (currentUser && bonusSpent > 0) {
      await spendBonus({
        userId: Number(currentUser.id),
        amount: bonusSpent,
        orderTotal: baseTotal,
        orderId: order.id,
      });
    }

    if (currentUser && data.paymentMethod === 'CASH_ON_DELIVERY') {
      try {
        await accrueBonus({
          userId: Number(currentUser.id),
          orderTotal: finalTotal,
          orderId: order.id,
        });
      } catch (e) {
        console.error('[CreateOrder] accrue bonus failed', e);
      }
    }

    
    if (currentUser && data.address) {
      await prisma.user.update({
        where: { id: Number(currentUser.id) },
        data: { address: data.address },
      });
    }

    
    const isOnlinePayment =
      data.paymentMethod === 'TELEGRAM_STARS' ||
      data.paymentMethod === 'MANUAL_TRANSFER' ||
      data.paymentMethod === 'ALIF_PAY' ||
      data.paymentMethod === 'YOOKASSA';

    if (!isOnlinePayment) {
      await prisma.cart.update({
        where: {
          id: userCart.id,
        },
        data: {
          totalAmount: 0,
        },
      });

      await prisma.cartItem.deleteMany({
        where: {
          cartId: userCart.id,
        },
      });
    }


    try {
      await sendEmail(
        data.email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items: userCart.items as any }) as React.ReactElement,
      );
    } catch (emailError) {
      console.log('[CreateOrder] Failed to send email', emailError);
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
        {
          entrance: order.entrance,
          floor: order.floor,
          doorCode: order.doorCode,
          apartment: order.apartment,
        }
      );
    } catch (tgError) {
      console.log('[CreateOrder] Failed to send Telegram notification', tgError);
    }

    
    if (!data.paymentMethod || data.paymentMethod === 'CASH_ON_DELIVERY') {
      try {
        const result = await sendOrderToIiko(order, userCart.items as any);
        if (result.status === 'failed') {
          console.warn(`[CreateOrder] iiko sync failed for order ${order.id}: ${result.reason}`);
        }
      } catch (iikoError) {
        console.error('[CreateOrder] iiko sync crashed:', iikoError);
      }
    }

    revalidatePath('/dashboard/orders');

    if (data.paymentMethod === 'ALIF_PAY') {
      return `/checkout/pay/${order.id}?method=ALIF`;
    }
    if (data.paymentMethod === 'YOOKASSA') {
      return `/checkout/pay/${order.id}?method=YOOKASSA`;
    }
    if (data.paymentMethod === 'TELEGRAM_STARS') {
      return `/checkout/pay/${order.id}?method=STARS`;
    }
    if (data.paymentMethod === 'MANUAL_TRANSFER') {
      return `/checkout/pay/${order.id}?method=TRANSFER`;
    }
    return `/order-success/${order.id}`;
  } catch (err) {
    console.log('[CreateOrder] Server error', err);
    throw err;
  }
}

export async function updateUserInfo(body: Prisma.UserUpdateInput) {
  try {
    const currentUser = await getUserSession();

    if (!currentUser) {
      throw new Error('Пользователь не найден');
    }

    const findUser = await prisma.user.findFirst({
      where: {
        id: Number(currentUser.id),
      },
    });

    await prisma.user.update({
      where: {
        id: Number(currentUser.id),
      },
      data: {
        fullName: body.fullName,
        email: body.email,
        password: body.password ? hashSync(body.password as string, 10) : findUser?.password,
        address: body.address,
      },
    });
  } catch (err) {
    console.log('Error [UPDATE_USER]', err);
    throw err;
  }
}

export async function registerUser(body: Prisma.UserCreateInput) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      if (!user.verified) {
        throw new Error('Почта не подтверждена');
      }

      throw new Error('Пользователь уже существует');
    }

    let referrerId: number | null = null;
    try {
      const cookieStore = cookies();
      const refCode = cookieStore.get('referralCode')?.value;
      if (refCode) {
        const ref = await prisma.user.findUnique({ where: { referralCode: refCode } });
        if (ref) referrerId = ref.id;
      }
    } catch {}

    const createdUser = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        password: hashSync(body.password, 10),
        referredById: referrerId,
      },
    });

    try {
      const { accrueDirectBonus, BONUS_WELCOME_AMOUNT } = await import('@/back/lib/bonus');
      await accrueDirectBonus({
        userId: createdUser.id,
        amount: BONUS_WELCOME_AMOUNT,
        type: 'WELCOME',
        description: 'Приветственный бонус за регистрацию',
      });
    } catch (e) {
      console.error('[Register] welcome bonus failed', e);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationCode.create({
      data: {
        code,
        userId: createdUser.id,
      },
    });

    await sendEmail(
      createdUser.email,
      'Next Pizza / 📝 Подтверждение регистрации',
      VerificationUserTemplate({
        code,
      }) as React.ReactElement,
    );
  } catch (err) {
    console.log('Error [CREATE_USER]', err);
    throw err;
  }
}

export async function verifyUser(code: string, email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
      },
    });

    if (!verificationCode) {
      throw new Error('Неверный код подтверждения');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: new Date() },
    });

    await prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    return true;
  } catch (err) {
    console.log('Error [VERIFY_USER]', err);
    throw err;
  }
}

export async function recordSearch(query: string) {
  try {
    if (!query || query.length < 3) return;

    if ((prisma as any).searchQuery) {
      await prisma.searchQuery.upsert({
        where: { query },
        update: { count: { increment: 1 } },
        create: { query, count: 1 },
      });
    }
  } catch (err) {
    console.log('Error [RECORD_SEARCH]', err);
  }
}

