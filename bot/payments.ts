import { Telegraf, Markup } from 'telegraf';
import * as dotenv from 'dotenv';
import { prisma } from '../back/prisma/prisma-client';
import { verifyOrder } from '../back/lib/payment-token';

dotenv.config();

const token = process.env.PAYMENTS_BOT_TOKEN;
const internalSecret = process.env.PAYMENT_INTERNAL_SECRET || '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const cardNumber = process.env.PAYMENT_CARD_NUMBER || '0000 0000 0000 0000';
const receiverName = process.env.PAYMENT_RECEIVER_NAME || 'NEXT PIZZA';
const receiverPhone = process.env.PAYMENT_RECEIVER_PHONE || '';
const bankName = process.env.PAYMENT_BANK_NAME || 'Алиф Банк';
const adminChatId = process.env.PAYMENTS_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

if (!token) {
  console.error('PAYMENTS_BOT_TOKEN is not set');
  process.exit(1);
}

const bot = new Telegraf(token);

const parseNum = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const STAR_PRICE_TJS = parseNum(process.env.STAR_PRICE_TJS, 0.14);
const STARS_FEE_PERCENT = parseNum(process.env.STARS_FEE_PERCENT, 43);

async function notifyConfirm(orderId: number, opts: {
  provider: string;
  ref?: string;
  confirmedBy?: string;
  proofUrl?: string;
}) {
  await fetch(`${siteUrl}/api/payments/telegram/confirm`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-internal-secret': internalSecret },
    body: JSON.stringify({ orderId, ...opts }),
  });
}

bot.start(async (ctx) => {
  const payload = (ctx.message as any)?.text?.split(' ')[1];
  console.log('[PaymentsBot] /start from', ctx.from?.id, 'payload:', payload);
  if (!payload) {
    return ctx.reply('Откройте оплату с сайта Next Pizza.');
  }

  const parsed = verifyOrder(payload);
  console.log('[PaymentsBot] verify result:', parsed);
  if (!parsed) return ctx.reply('Ссылка недействительна или устарела.');

  const order = await prisma.order.findUnique({ where: { id: parsed.orderId } });
  if (!order) return ctx.reply('Заказ не найден.');

  if (order.paymentStatus === 'PAID') {
    return ctx.reply(`Заказ #${order.id} уже оплачен. Спасибо!`);
  }

  if (parsed.method === 'STARS') {
    const feeExact = (order.totalAmount * STARS_FEE_PERCENT) / 100;
    const grossExact = order.totalAmount + feeExact;
    const fee = Math.round(feeExact * 100) / 100;
    const grossAmount = Math.round(grossExact * 100) / 100;
    const totalStars = Math.max(1, Math.ceil(grossExact / STAR_PRICE_TJS));

    await ctx.reply(
      `⚠️ *Внимание: наценка за оплату звёздами*\n\n` +
        `Telegram удерживает *30%* комиссии с каждого платежа звёздами.\n` +
        `Поэтому к сумме заказа добавляется *+${STARS_FEE_PERCENT}%* наценка.\n\n` +
        `*Почему +${STARS_FEE_PERCENT}%, а не +30%?*\n` +
        `Если просто прибавить 30%, после удержания Telegram’ом нам придёт лишь ~91% от стоимости заказа. ` +
        `Формула: сумма ÷ (1 − 0,30) ≈ сумма × 1,43. Так после комиссии нам приходит ровно стоимость заказа.\n\n` +
        `📦 Сумма заказа: *${order.totalAmount} TJS*\n` +
        `➕ Наценка (${STARS_FEE_PERCENT}%): *+${fee} TJS*\n` +
        `💰 *Итого: ${grossAmount} TJS (${totalStars} ⭐)*\n\n` +
        `Если не хотите переплачивать — отмените и выберите «Перевод на карту» или оплату курьеру.`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(`⭐ Оплатить ${totalStars} звёзд`, `pay_stars_${order.id}`)],
          [Markup.button.callback('❌ Отменить', `cancel_${order.id}`)],
        ]),
      },
    );
    return;
  }

  // MANUAL_TRANSFER
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PENDING' },
  });

  const text =
    `💳 *Оплата заказа #${order.id}*\n\n` +
    `Сумма к оплате: *${order.totalAmount} TJS*\n\n` +
    `Переведите эту сумму на счёт:\n` +
    `🏦 Банк: *${bankName}*\n` +
    `💳 Карта: \`${cardNumber}\`\n` +
    (receiverPhone ? `📱 По номеру: \`${receiverPhone}\`\n` : '') +
    `👤 Получатель: ${receiverName}\n\n` +
    `📝 В комментарии к переводу укажите: *#${order.id}*\n\n` +
    `После перевода нажмите кнопку ниже и пришлите скриншот чека.`;

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      Markup.button.callback('✅ Я оплатил, прикрепить чек', `paid_${order.id}`),
      Markup.button.callback('❌ Отменить', `cancel_${order.id}`),
    ]),
  });
});

bot.on('pre_checkout_query', async (ctx) => {
  try {
    const payload: string = (ctx.preCheckoutQuery as any).invoice_payload;
    const orderId = Number(payload.replace('order_', ''));
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentStatus === 'PAID') {
      return ctx.answerPreCheckoutQuery(false, 'Заказ недоступен для оплаты');
    }
    await ctx.answerPreCheckoutQuery(true);
  } catch (e) {
    await ctx.answerPreCheckoutQuery(false, 'Ошибка проверки');
  }
});

bot.on('message', async (ctx, next) => {
  const msg: any = ctx.message;
  if (msg?.successful_payment) {
    const payload: string = msg.successful_payment.invoice_payload;
    const orderId = Number(payload.replace('order_', ''));
    const chargeId =
      msg.successful_payment.telegram_payment_charge_id ||
      msg.successful_payment.provider_payment_charge_id;
    await notifyConfirm(orderId, {
      provider: 'TELEGRAM_STARS',
      ref: chargeId,
      confirmedBy: `tg:${ctx.from?.id}`,
    });
    await ctx.reply(
      `✅ *Платёж получен!*\n\nЗаказ #${orderId} принят в работу. Нажмите кнопку, чтобы вернуться:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('📦 Перейти к заказу', `${siteUrl}/order-success/${orderId}`),
        ]),
      },
    );
    return;
  }

  // Photo upload for manual transfer proof
  const session = pendingProof.get(ctx.from!.id);
  if (session && msg.photo) {
    const photo = msg.photo[msg.photo.length - 1];
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);

    await prisma.order.update({
      where: { id: session.orderId },
      data: {
        paymentStatus: 'AWAITING_CONFIRMATION',
        paymentProof: fileLink.toString(),
        paymentProvider: 'MANUAL_TRANSFER',
      },
    });

    pendingProof.delete(ctx.from!.id);
    await ctx.reply(
      '📨 Чек получен. Ожидайте подтверждения администратором — обычно занимает несколько минут.',
    );

    if (adminChatId) {
      const order = await prisma.order.findUnique({ where: { id: session.orderId } });
      await ctx.telegram.sendPhoto(adminChatId, photo.file_id, {
        caption:
          `💳 *Новый платёж по переводу*\n\n` +
          `Заказ: *#${session.orderId}*\n` +
          `Сумма: *${order?.totalAmount} TJS*\n` +
          `Клиент: ${order?.fullName} (${order?.phone})\n` +
          `От: @${ctx.from?.username || ctx.from?.id}`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Подтвердить', `admin_confirm_${session.orderId}_${ctx.from!.id}`),
            Markup.button.callback('❌ Отклонить', `admin_reject_${session.orderId}_${ctx.from!.id}`),
          ],
        ]),
      });
    }
    return;
  }

  return next();
});

const pendingProof = new Map<number, { orderId: number }>();

bot.action(/^pay_stars_(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      await ctx.answerCbQuery('Заказ не найден');
      return;
    }
    if (order.paymentStatus === 'PAID') {
      await ctx.answerCbQuery('Уже оплачено');
      return;
    }

    const feeExact = (order.totalAmount * STARS_FEE_PERCENT) / 100;
    const grossExact = order.totalAmount + feeExact;
    const fee = Math.round(feeExact * 100) / 100;
    const grossAmount = Math.round(grossExact * 100) / 100;
    const totalStars = Math.max(1, Math.ceil(grossExact / STAR_PRICE_TJS));

    await ctx.answerCbQuery();
    await ctx.replyWithInvoice({
      title: `Заказ #${order.id}`,
      description:
        `Оплата заказа в Next Pizza. ` +
        `Сумма ${order.totalAmount} TJS + наценка ${STARS_FEE_PERCENT}% = ${grossAmount} TJS`,
      payload: `order_${order.id}`,
      provider_token: '',
      currency: 'XTR',
      prices: [{ label: `Заказ #${order.id} (${grossAmount} TJS)`, amount: totalStars }],
    } as any);
  } catch (e: any) {
    console.error('[pay_stars] failed', e);
    await ctx.answerCbQuery('Ошибка отправки счёта');
    await ctx.reply(`Не удалось создать счёт: ${e?.message || 'неизвестная ошибка'}`);
  }
});

bot.action(/^paid_(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  pendingProof.set(ctx.from!.id, { orderId });
  await ctx.answerCbQuery();
  await ctx.reply('📷 Пришлите скриншот или фото чека одним сообщением.');
});

bot.action(/^cancel_(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
  });
  try {
    const cart = await prisma.cart.findFirst({ where: { token: order.token } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0 } });
    }
  } catch {}
  await ctx.answerCbQuery('Отменено');
  await ctx.editMessageText(`❌ Заказ #${orderId} отменён.`);
});

bot.action(/^admin_confirm_(\d+)_(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  const clientTgId = ctx.match[2];

  await notifyConfirm(orderId, {
    provider: 'MANUAL_TRANSFER',
    confirmedBy: `tg-admin:${ctx.from?.id}`,
  });

  await ctx.answerCbQuery('Подтверждено');
  await ctx.editMessageCaption(
    `${(ctx.callbackQuery as any).message.caption}\n\n✅ *Подтверждено* @${ctx.from?.username || ctx.from?.id}`,
    { parse_mode: 'Markdown' },
  );

  try {
    await ctx.telegram.sendMessage(
      clientTgId,
      `✅ *Платёж по заказу #${orderId} подтверждён!*\n\nВаш заказ принят в работу. Нажмите кнопку ниже, чтобы вернуться к заказу:`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.url('📦 Перейти к заказу', `${siteUrl}/order-success/${orderId}`),
        ]),
      },
    );
  } catch {}
});

bot.action(/^admin_reject_(\d+)_(\d+)$/, async (ctx) => {
  const orderId = Number(ctx.match[1]);
  const clientTgId = ctx.match[2];

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'FAILED' },
  });

  await ctx.answerCbQuery('Отклонено');
  await ctx.editMessageCaption(
    `${(ctx.callbackQuery as any).message.caption}\n\n❌ *Отклонено* @${ctx.from?.username || ctx.from?.id}`,
    { parse_mode: 'Markdown' },
  );

  try {
    await ctx.telegram.sendMessage(
      clientTgId,
      `❌ Платёж по заказу #${orderId} не подтверждён. Свяжитесь с поддержкой.`,
    );
  } catch {}
});

const isAdmin = (ctx: any) =>
  adminChatId && String(ctx.from?.id) === String(adminChatId);

bot.command('balance', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const txs: any = await (bot.telegram as any).callApi('getStarTransactions', { limit: 100 });
    let incoming = 0;
    let outgoing = 0;
    let refunded = 0;
    for (const tx of txs.transactions ?? []) {
      if (tx.source) incoming += tx.amount;
      else if (tx.receiver) outgoing += tx.amount;
      if (tx.source?.type === 'refund') refunded += tx.amount;
    }
    const balance = incoming - outgoing;
    await ctx.reply(
      `💫 *Баланс звёзд бота*\n\n` +
        `Текущий баланс: *${balance} ⭐*\n` +
        `Всего получено: ${incoming} ⭐\n` +
        `Возвращено клиентам: ${refunded} ⭐\n` +
        `Выведено / потрачено: ${outgoing} ⭐\n\n` +
        (balance >= 1000
          ? `✅ Можно выводить. /withdraw для инструкции.`
          : `Для вывода нужно минимум 1000 ⭐ (ещё ${1000 - balance} ⭐).`),
      { parse_mode: 'Markdown' },
    );
  } catch (e: any) {
    await ctx.reply(`Ошибка получения баланса: ${e?.message}`);
  }
});

bot.command('transactions', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const txs: any = await (bot.telegram as any).callApi('getStarTransactions', { limit: 20 });
    if (!txs.transactions?.length) return ctx.reply('Транзакций пока нет.');
    const lines = txs.transactions.map((tx: any) => {
      const dir = tx.source ? '⬇️ +' : '⬆️ −';
      const who = tx.source?.user?.username || tx.receiver?.user?.username || '?';
      const date = new Date(tx.date * 1000).toLocaleString('ru-RU');
      return `${dir}${tx.amount} ⭐  @${who}  \`${tx.id}\`\n${date}`;
    });
    await ctx.reply(`📜 *Последние транзакции:*\n\n${lines.join('\n\n')}`, {
      parse_mode: 'Markdown',
    });
  } catch (e: any) {
    await ctx.reply(`Ошибка: ${e?.message}`);
  }
});

bot.command('refund', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const parts = (ctx.message as any).text.split(' ');
  if (parts.length < 3) return ctx.reply('Использование: /refund <userId> <chargeId>');
  const [, userId, chargeId] = parts;
  try {
    await (bot.telegram as any).callApi('refundStarPayment', {
      user_id: Number(userId),
      telegram_payment_charge_id: chargeId,
    });
    await ctx.reply(`✅ Возврат выполнен.`);
  } catch (e: any) {
    await ctx.reply(`Ошибка возврата: ${e?.message}`);
  }
});

bot.command('refund_all_admin', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const txs: any = await (bot.telegram as any).callApi('getStarTransactions', { limit: 100 });
    const myPayments = (txs.transactions ?? []).filter(
      (tx: any) =>
        tx.source?.type === 'user' &&
        String(tx.source.user?.id) === String(adminChatId),
    );

    if (!myPayments.length) {
      return ctx.reply('Нет платежей от вашего аккаунта для возврата.');
    }

    let refunded = 0;
    let failed = 0;
    for (const tx of myPayments) {
      try {
        await (bot.telegram as any).callApi('refundStarPayment', {
          user_id: Number(adminChatId),
          telegram_payment_charge_id: tx.id,
        });
        refunded += tx.amount;
      } catch {
        failed++;
      }
    }

    await ctx.reply(
      `✅ Возвращено: *${refunded} ⭐*\n` +
        (failed ? `⚠️ Не удалось: ${failed} платежей (возможно, уже возвращены)\n` : '') +
        `Звёзды вернутся на ваш аккаунт.`,
      { parse_mode: 'Markdown' },
    );
  } catch (e: any) {
    await ctx.reply(`Ошибка: ${e?.message}`);
  }
});

bot.command('withdraw', async (ctx) => {
  if (!isAdmin(ctx)) return;
  await ctx.reply(
    `*Как вывести звёзды:*\n\n` +
      `1. Откройте @BotFather → /mybots → ${process.env.PAYMENTS_BOT_USERNAME || 'ваш бот'}\n` +
      `2. Bot Settings → попробуйте найти «Stars» или «Balance»\n` +
      `3. Если кнопки нет — Telegram ещё не выкатил UI, используйте /balance здесь\n\n` +
      `Для реального вывода нужно:\n` +
      `• Минимум 1000 ⭐\n` +
      `• TON-кошелёк (Tonkeeper или @wallet)\n` +
      `• Подождать 21 день после запроса\n\n` +
      `После прихода TON меняете на USDT → P2P на Bybit → TJS на карту.`,
    { parse_mode: 'Markdown' },
  );
});

bot.catch((err, ctx) => {
  console.error('[PaymentsBot] error in update', ctx.updateType, err);
});

bot.launch();
console.log('Payments bot is running');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
