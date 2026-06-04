import { Telegraf, Context } from 'telegraf';
import * as dotenv from 'dotenv';
import { prisma } from '../back/prisma/prisma-client';
import { OrderStatus, BotUser } from '@prisma/client';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const mainAdminId = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in .env');
  process.exit(1);
}

interface MyContext extends Context {
  botUser?: BotUser & { store?: any };
}

const bot = new Telegraf<MyContext>(token);

bot.use(async (ctx, next) => {
  if (!ctx.chat || !ctx.from) return;

  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username;

  try {
    let user = await prisma.botUser.findUnique({
      where: { chatId },
      include: { store: true },
    });

    if (mainAdminId && chatId === mainAdminId.toString()) {
      if (!user) {
        user = await prisma.botUser.create({
          data: {
            chatId,
            username,
            isSuperAdmin: true,
          },
          include: { store: true },
        });
      } else if (!user.isSuperAdmin) {
        user = await prisma.botUser.update({
          where: { chatId },
          data: { isSuperAdmin: true },
          include: { store: true },
        });
      }
    }

    if (!user) {

      if (ctx.message && 'text' in ctx.message && ctx.message.text === '/start') {
        return ctx.reply(`🚫 Доступ ограничен.\n\nЧтобы получить права администратора, передайте свой Username главному админу.\n\nВаш Username: @${username || 'не установлен'}\nВаш ID: ${chatId}`);
      }
      // На всё остальное просто молчим (игнорим)
      return;
    }

    // Сохраняем пользователя в контекст
    ctx.botUser = user;
    return next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return ctx.reply('Ошибка авторизации.');
  }
});

bot.start((ctx) => {
  const user = ctx.botUser!;
  ctx.reply(`С возвращением, ${user.username || 'админ'}!${user.isSuperAdmin ? ' (Главный админ)' : ''}${user.store ? `\nВы привязаны к заведению: ${user.store.name}` : ''}`);
});

bot.command('addadmin', async (ctx) => {
  if (!ctx.botUser?.isSuperAdmin) return ctx.reply('Только главный админ может добавлять других.');

  const text = (ctx.message as any).text.split(' ');
  if (text.length < 2) return ctx.reply('Использование: /addadmin @username');

  const targetUsername = text[1].replace('@', '');

  try {

    const targetUser = await prisma.botUser.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) return ctx.reply('Пользователь не найден. Он должен сначала написать боту /start');

    await prisma.botUser.update({
      where: { id: targetUser.id },
      data: { isSuperAdmin: false },
    });

    ctx.reply(`Пользователь @${targetUsername} теперь имеет доступ к боту.`);
  } catch (error) {
    ctx.reply('Ошибка при добавлении админа.');
  }
});

bot.command('assign', async (ctx) => {
  if (!ctx.botUser?.isSuperAdmin) return ctx.reply('Только главный админ может привязывать заведения.');

  const text = (ctx.message as any).text.split(' ');
  if (text.length < 3) return ctx.reply('Использование: /assign @username [ID заведения]');

  const targetUsername = text[1].replace('@', '');
  const storeId = parseInt(text[2]);

  try {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) return ctx.reply('Заведение с таким ID не найдено.');

    const targetUser = await prisma.botUser.findUnique({ where: { username: targetUsername } });
    if (!targetUser) return ctx.reply('Пользователь не найден.');

    await prisma.botUser.update({
      where: { id: targetUser.id },
      data: { storeId },
    });

    ctx.reply(`@${targetUsername} привязан к заведению "${store.name}".`);
  } catch (error) {
    ctx.reply('Ошибка при привязке.');
  }
});

bot.command('addcourier', async (ctx) => {
  if (!ctx.botUser?.isSuperAdmin) return ctx.reply('Только главный админ может добавлять курьеров.');

  const text = (ctx.message as any).text.split(' ');
  if (text.length < 2) return ctx.reply('Использование: /addcourier @username');

  const targetUsername = text[1].replace('@', '');

  try {
    const targetUser = await prisma.botUser.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) return ctx.reply('Пользователь не найден. Он должен сначала написать боту /start');

    await prisma.botUser.update({
      where: { id: targetUser.id },
      data: { isCourier: true },
    });

    // Синхронизируем с основной базой сайта
    await prisma.user.upsert({
      where: { telegramUsername: targetUsername },
      update: { role: 'COURIER' },
      create: {
        email: `${targetUsername}@tg.bot`, // Заглушка для email
        fullName: targetUsername,
        role: 'COURIER',
        telegramUsername: targetUsername,
        password: '', // Пустой пароль
      }
    });

    ctx.reply(`Пользователь @${targetUsername} теперь отмечен как курьер и добавлен в базу сайта.`);
  } catch (error) {
    ctx.reply('Ошибка при добавлении курьера.');
  }
});

bot.command('help', (ctx) => {
  const isSuper = ctx.botUser?.isSuperAdmin;
  ctx.reply(`
Доступные команды:
/stats - Статистика
/orders - Активные заказы
/reviews - Последние отзывы
${isSuper ? '\nКоманды главного админа:\n/addadmin @username - Дать доступ\n/addcourier @username - Назначить курьером\n/assign @username [id] - Привязать к заведению' : ''}
/help - Список команд
  `, { parse_mode: 'Markdown' });
});

bot.command('stats', async (ctx) => {
  try {
    const user = ctx.botUser!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      createdAt: { gte: today },
      status: 'SUCCEEDED',
    };

    if (!user.isSuperAdmin && user.storeId) {
      where.storeId = user.storeId;
    }

    const ordersToday = await prisma.order.findMany({ where });

    const todayRevenue = ordersToday.reduce((sum, order) => sum + order.totalAmount, 0);
    const todayOrders = ordersToday.length;

    let text = `📊 *Статистика заказов за сегодня:*\n`;
    if (user.storeId && !user.isSuperAdmin) {
      text += `🏢 *Заведение:* ${user.store.name}\n`;
    }
    text += `✅ Завершено: ${todayOrders}\n💰 Выручка: ${todayRevenue} TJS\n`;

    if (user.isSuperAdmin) {
      const globalStats = await prisma.globalStat.findUnique({ where: { id: 1 } });
      text += `\n🌍 *За все время (Общая):*\n✅ Завершено: ${globalStats?.totalOrders || 0}\n💰 Выручка: ${globalStats?.totalRevenue || 0} TJS`;
    }

    ctx.reply(text, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('Ошибка при получении статистики');
  }
});

bot.command('orders', async (ctx) => {
  try {
    const user = ctx.botUser!;
    const where: any = {
      status: { in: ['PENDING', 'COOKING', 'READY', 'DELIVERING'] },
    };

    if (!user.isSuperAdmin && user.storeId) {
      where.storeId = user.storeId;
    }

    if (user.isCourier && !user.isSuperAdmin) {
      // Курьер видит только свои заказы
      // Но в BotUser нет прямой связи с User.id, поэтому ищем по username
      const webUser = await prisma.user.findUnique({ where: { email: user.username + '@gmail.com' } }); // Это костыль, но в идеале нужно связать
      // Для теста: курьеры видят все READY заказы
      where.status = { in: ['READY', 'DELIVERING'] };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (orders.length === 0) return ctx.reply('Активных заказов нет.');

    const text = orders.map(o => `Заказ #${o.id} - ${o.totalAmount} TJS (${o.status})`).join('\n');
    ctx.reply(`*Последние активные заказы:*\n\n${text}`, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('Ошибка при получении списка заказов');
  }
});

bot.on('callback_query', async (ctx) => {
  // @ts-ignore
  const data = ctx.callbackQuery.data;
  const user = ctx.botUser!;

  if (data.startsWith('order_status_')) {
    const parts = data.split('_');
    const status = parts[2] as OrderStatus;
    const orderId = Number(parts[3]);

    try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return ctx.answerCbQuery('Заказ не найден');

      // Проверка прав
      if (!user.isSuperAdmin && user.isCourier) {
         // Если курьер пытается обновить, проверяем, назначен ли он (или даем взять заказ)
         if (!order.courierId && status === 'DELIVERING') {
            // Курьер берет заказ
            // Нужно найти веб-юзера
            const webUser = await prisma.user.findFirst({ where: { fullName: user.username || '' } });
            if (webUser) {
               await prisma.order.update({ where: { id: orderId }, data: { courierId: webUser.id, status: 'DELIVERING' } });
               return ctx.answerCbQuery('Вы взяли заказ!');
            }
         }
      }

      if (!user.isSuperAdmin && user.storeId && order.storeId !== user.storeId) {
        return ctx.answerCbQuery('Нет прав на этот заказ');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

      if (status === 'COOKING' || status === 'READY') {
         await notifyCouriers(orderId);
      }

      if (status === 'SUCCEEDED') {
        await prisma.globalStat.upsert({
          where: { id: 1 },
          update: { totalRevenue: { increment: order.totalAmount }, totalOrders: { increment: 1 } },
          create: { id: 1, totalRevenue: order.totalAmount, totalOrders: 1 },
        });
      }

      await ctx.answerCbQuery('Статус обновлен');
      // @ts-ignore
      await ctx.editMessageText(`${ctx.callbackQuery.message.text}\n\n✅ *Статус обновлен на:* ${status}`, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.answerCbQuery('Ошибка обновления');
    }
  }

  if (data.startsWith('assign_courier_')) {
    const orderId = Number(data.split('_')[2]);
    const courierId = Number(data.split('_')[3]);

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { courierId },
      });
      await ctx.answerCbQuery('Курьер назначен');
      // @ts-ignore
      await ctx.editMessageText(`${ctx.callbackQuery.message.text}\n\n🚴‍♂️ *Курьер назначен!*`, { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.answerCbQuery('Ошибка назначения');
    }
  }
});

// Уведомление
export async function notifyNewOrder(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true }
    });
    if (!order) return;

    const admins = await prisma.botUser.findMany({ where: { OR: [{ isSuperAdmin: true }, { storeId: order.storeId }] } });

    const text = `🔔 *Новый заказ #${order.id}*\n💰 Сумма: ${order.totalAmount} TJS\n🏢 Заведение: ${order.store?.name || 'Самовывоз'}\n📍 Адрес: ${order.address || 'В заведении'}\n📞 Тел: ${order.phone}`;

    for (const admin of admins) {
        bot.telegram.sendMessage(admin.chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏳ Готовится', callback_data: `order_status_COOKING_${order.id}` }, { text: '✅ Готов', callback_data: `order_status_READY_${order.id}` }],
            ]
          }
        });
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Уведомление курьеров (когда заказ принят или готов)
export async function notifyCouriers(orderId: number) {
   try {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) return;

      const couriers = await prisma.user.findMany({
         where: {
            role: 'COURIER',
            telegramUsername: { not: null }
         }
      });

      if (couriers.length === 0) return;

      const text = `🚴‍♂️ *Заказ #${order.id} готов к доставке!*\n📍 Адрес: ${order.address}\n💰 Оплата: ${order.totalAmount} TJS\n📞 Клиент: ${order.fullName} (${order.phone})`;

      // Ищем всех курьеров в боте по их юзернеймам
      const telegramUsernames = couriers.map(c => c.telegramUsername?.replace('@', ''));
      const botCouriers = await prisma.botUser.findMany({
         where: {
            username: { in: telegramUsernames as string[] },
            isCourier: true
         }
      });

      if (botCouriers.length === 0) return;

      // Отправляем одному случайному (как просили)
      const randomCourier = botCouriers[Math.floor(Math.random() * botCouriers.length)];

      bot.telegram.sendMessage(randomCourier.chatId, text, {
         parse_mode: 'Markdown',
         reply_markup: {
            inline_keyboard: [
               [{ text: '🚀 Взять заказ', callback_data: `order_status_DELIVERING_${order.id}` }]
            ]
         }
      });
   } catch (error) {
      console.error('Courier notification error:', error);
   }
}

// Периодическая очистка и АВТО-НАЗНАЧЕНИЕ
setInterval(async () => {
  // 1. Очистка старых заказов
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.order.deleteMany({
    where: { status: { in: ['SUCCEEDED', 'CANCELLED'] }, updatedAt: { lt: oneDayAgo } }
  });

  // 2. Авто-назначение курьеров (если прошло 5 минут и курьера нет)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const unassignedOrders = await prisma.order.findMany({
     where: {
        courierId: null,
        status: { in: ['COOKING', 'READY'] },
        createdAt: { lt: fiveMinutesAgo },
        deliveryType: 'DELIVERY'
     }
  });

  if (unassignedOrders.length > 0) {
     const couriers = await prisma.user.findMany({
        where: {
           role: 'COURIER',
           telegramUsername: { not: null }
        }
     });

     if (couriers.length > 0) {
        for (const order of unassignedOrders) {
           const courier = couriers[Math.floor(Math.random() * couriers.length)];
           await prisma.order.update({ where: { id: order.id }, data: { courierId: courier.id } });

           // Уведомляем курьера в телеграм
           const tgUsername = courier.telegramUsername?.replace('@', '');
           const botCourier = await prisma.botUser.findFirst({ where: { username: tgUsername } });
           if (botCourier) {
              bot.telegram.sendMessage(botCourier.chatId, `⚠️ *Авто-назначение:*\nВам назначен заказ #${order.id} (админ не назначил вовремя).`, { parse_mode: 'Markdown' });
           }
        }
     }
  }
}, 60 * 1000); // Раз в минуту

bot.launch();
console.log('Multi-Admin Bot is running with Courier support...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
