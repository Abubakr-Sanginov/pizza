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

// Middleware для авторизации и прав доступа
bot.use(async (ctx, next) => {
  if (!ctx.chat || !ctx.from) return;

  const chatId = ctx.chat.id.toString();
  const username = ctx.from.username;

  try {
    let user = await prisma.botUser.findUnique({
      where: { chatId },
      include: { store: true },
    });

    // Бутстрап главного админа из .env
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
      // Отвечаем только на /start, чтобы человек мог узнать свой ник для админа
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
    // Находим пользователя по username (он должен был хотя бы раз написать боту /start)
    const targetUser = await prisma.botUser.findUnique({
      where: { username: targetUsername },
    });

    if (!targetUser) return ctx.reply('Пользователь не найден. Он должен сначала написать боту /start');

    await prisma.botUser.update({
      where: { id: targetUser.id },
      data: { isSuperAdmin: false }, // Просто подтверждаем статус админа (не супер)
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

bot.command('help', (ctx) => {
  const isSuper = ctx.botUser?.isSuperAdmin;
  ctx.reply(`
Доступные команды:
/stats - Статистика (вашего заведения или общая)
/orders - Активные заказы
/reviews - Последние отзывы
/menu - Список товаров
${isSuper ? '\nКоманды главного админа:\n/addadmin @username - Дать доступ\n/assign @username [id] - Привязать к заведению' : ''}
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

bot.command('reviews', async (ctx) => {
  try {
    const user = ctx.botUser!;
    const where: any = {};
    
    // Отзывы пока не привязаны к Store в схеме, поэтому показываем всем или фильтруем по продуктам?
    // В данной схеме Review -> Product. Product -> Category. 
    // Пока оставим общим, либо будем фильтровать, если нужно.

    const reviews = await prisma.review.findMany({
      include: { user: true, product: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (reviews.length === 0) return ctx.reply('Отзывов пока нет.');

    for (const review of reviews) {
      const text = `💬 *Отзыв от ${review.user.fullName}*\n🛒 *Товар:* ${review.product.name}\n⭐ *Оценка:* ${review.rating}/5\n📝 *Комментарий:* ${review.comment || 'нет'}`;
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '❌ Удалить', callback_data: `delete_review_${review.id}` }]],
        },
      });
    }
  } catch (error) {
    ctx.reply('Ошибка при получении отзывов');
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

      // Проверка прав на изменение
      if (!user.isSuperAdmin && user.storeId && order.storeId !== user.storeId) {
        return ctx.answerCbQuery('У вас нет прав на этот заказ (чужое заведение)');
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status },
      });

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

  if (data.startsWith('delete_review_')) {
    const reviewId = Number(data.split('_')[2]);
    try {
      await prisma.review.delete({ where: { id: reviewId } });
      await ctx.answerCbQuery('Отзыв удален');
      await ctx.editMessageText('❌ *Отзыв удален администратором.*', { parse_mode: 'Markdown' });
    } catch (error) {
      await ctx.answerCbQuery('Ошибка удаления');
    }
  }
});

// Функция для рассылки уведомлений о новых заказах
export async function notifyNewOrder(orderId: number) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { store: true }
    });
    if (!order) return;

    const admins = await prisma.botUser.findMany();
    
    const text = `🔔 *Новый заказ #${order.id}*\n💰 Сумма: ${order.totalAmount} TJS\n🏢 Заведение: ${order.store?.name || 'Самовывоз/Общее'}\n📍 Адрес: ${order.address || 'В заведении'}\n📞 Тел: ${order.phone}`;

    for (const admin of admins) {
      // Отправляем если:
      // 1. Это супер-админ (видит всё)
      // 2. Это админ заведения, к которому относится заказ
      if (admin.isSuperAdmin || (order.storeId && admin.storeId === order.storeId)) {
        bot.telegram.sendMessage(admin.chatId, text, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⏳ Готовится', callback_data: `order_status_COOKING_${order.id}` }, { text: '✅ Готов', callback_data: `order_status_READY_${order.id}` }],
              [{ text: '🏁 Завершен', callback_data: `order_status_SUCCEEDED_${order.id}` }],
            ]
          }
        });
      }
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Периодическая очистка (как была)
setInterval(async () => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.order.deleteMany({
    where: { status: { in: ['SUCCEEDED', 'CANCELLED'] }, updatedAt: { lt: oneDayAgo } }
  });
  if (result.count > 0) {
    const mainAdmin = await prisma.botUser.findFirst({ where: { isSuperAdmin: true } });
    if (mainAdmin) bot.telegram.sendMessage(mainAdmin.chatId, `🧹 Очистка: удалено ${result.count} заказов.`);
  }
}, 60 * 60 * 1000);

bot.launch();
console.log('Multi-Admin Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
