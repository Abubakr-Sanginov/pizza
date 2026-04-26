'use server';

import React from 'react';
import { prisma } from '@/back/prisma/prisma-client';
import { PayOrderTemplate } from '@/shared/components';
import { OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes/order-success';
import { VerificationUserTemplate } from '@/shared/components/shared/email-temapltes/verification-user';
import { CheckoutFormValues } from '@/shared/constants';
import { createPayment } from '@/back/lib/creat-payment';
import { sendEmail } from '@/back/lib/send-email';
import { getUserSession } from '@/back/lib/get-user-session';
import { OrderStatus, Prisma } from '@prisma/client';
import { hashSync } from 'bcrypt';
import { cookies } from 'next/headers';
import { sendOrderNotification } from '@/bot/service';

export async function createOrder(data: CheckoutFormValues) {
  try {
    const cookieStore = cookies();
    const cartToken = cookieStore.get('cartToken')?.value;

    if (!cartToken) {
      throw new Error('Cart token not found');
    }

    /* Находим корзину по токену */
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

    /* Если корзина не найдена возвращаем ошибку */
    if (!userCart) {
      throw new Error('Cart not found');
    }

    /* Если корзина пустая возвращаем ошибку */
    if (userCart?.totalAmount === 0) {
      throw new Error('Cart is empty');
    }

    const currentUser = await getUserSession();

    let finalStoreId = data.storeId;

    // Если это доставка и у нас есть координаты, находим ближайший ресторан
    if (data.deliveryType === 'DELIVERY' && data.lat && data.lng) {
      const stores = await prisma.store.findMany();
      if (stores.length > 0) {
        let minDistance = Infinity;
        let nearestStoreId = stores[0].id;

        const toRad = (val: number) => (val * Math.PI) / 180;

        for (const store of stores) {
          if (store.lat && store.lng) {
            const R = 6371; // км
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

    /* Создаем заказ */
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
        totalAmount: userCart.totalAmount,
        status: OrderStatus.PENDING,
        items: JSON.stringify(userCart.items),
        userId: currentUser ? Number(currentUser.id) : null,
      },
    });

    /* Сохраняем адрес в профиль пользователя, если он авторизован */
    if (currentUser && data.address) {
      await prisma.user.update({
        where: { id: Number(currentUser.id) },
        data: { address: data.address },
      });
    }

    /* Очищаем корзину */
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

    // We removed online payment. Order logic completes here.
    try {
      await sendEmail(
        data.email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items: userCart.items as any }) as React.ReactElement,
      );
    } catch (emailError) {
      console.log('[CreateOrder] Failed to send email', emailError);
    }

    /* Отправляем уведомление в Telegram */
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

    return '/?paid';
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

    const createdUser = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        password: hashSync(body.password, 10),
      },
    });

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

    // @ts-ignore
    if (prisma.searchQuery) {
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

