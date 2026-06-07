import axios from 'axios';
import { prisma } from '@/back/prisma/prisma-client';

// Экранирование HTML-спецсимволов (используем HTML вместо Markdown)
function esc(text: string | null | undefined): string {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Форматирование позиции — работает для пицц и не-пицц
function formatItem(item: any): string {
  const name = esc(item?.productItem?.product?.name ?? 'Неизвестный товар');
  const qty = item?.quantity ?? 1;
  const size = item?.productItem?.size;
  const pizzaType = item?.productItem?.pizzaType;
  let details = '';
  if (size) details += ` ${size} см`;
  if (pizzaType != null) details += pizzaType === 1 ? ', традиционное' : ', тонкое';
  const ings = (item?.ingredients ?? []).map((i: any) => esc(i?.name)).join(', ');
  return `• ${name}${details}${ings ? ` + ${ings}` : ''}  ×  ${qty}`;
}

export const sendOrderNotification = async (
  orderId: number,
  totalAmount: number,
  fullName: string,
  phone: string,
  address: string,
  items: any[],
  storeId?: number | null,
  deliveryDetails?: { entrance?: string|null; floor?: string|null; doorCode?: string|null; apartment?: string|null },
) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const mainAdminId = process.env.TELEGRAM_CHAT_ID;
  if (!token) { console.warn('[TG] TELEGRAM_BOT_TOKEN not set'); return; }

  const itemsList = items.length > 0 ? items.map(formatItem).join('\n') : '— нет позиций —';

  const addrExtra = deliveryDetails
    ? `\n🚪 Подъезд: ${esc(deliveryDetails.entrance)||'-'} | Этаж: ${esc(deliveryDetails.floor)||'-'} | Кв: ${esc(deliveryDetails.apartment)||'-'}\n🔑 Код: ${esc(deliveryDetails.doorCode)||'-'}`
    : '';

  const text = [
    `🆕 <b>Новый заказ #${orderId}</b>`,
    '',
    `👤 <b>Клиент:</b> ${esc(fullName)}`,
    `📞 <b>Телефон:</b> ${esc(phone)}`,
    `📍 <b>Адрес:</b> ${esc(address)}${addrExtra}`,
    `💰 <b>Сумма:</b> ${totalAmount} TJS`,
    `🏢 <b>Точка ID:</b> ${storeId ?? '—'}`,
    '',
    '📦 <b>Состав:</b>',
    itemsList,
  ].join('\n');

  const keyboard = {
    inline_keyboard: [
      [{ text: '⏳ Готовится', callback_data: `order_status_COOKING_${orderId}` }, { text: '✅ Готов', callback_data: `order_status_READY_${orderId}` }],
      [{ text: '🚚 Доставляется', callback_data: `order_status_DELIVERING_${orderId}` }, { text: '🏁 Завершён', callback_data: `order_status_SUCCEEDED_${orderId}` }],
      [{ text: '❌ Отменить', callback_data: `order_status_CANCELLED_${orderId}` }],
    ],
  };

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const admins = await prisma.botUser.findMany({ include: { store: true } });
    const targets: string[] = [];

    for (const admin of admins) {
      const isSuper = admin.isSuperAdmin || (mainAdminId && admin.chatId === mainAdminId);
      const isStore = storeId && admin.storeId === storeId;
      if (isSuper || isStore) targets.push(admin.chatId);
    }

    if (targets.length === 0 && mainAdminId) targets.push(mainAdminId);

    if (targets.length === 0) {
      console.warn(`[TG] Order #${orderId}: no recipients — botUser empty & TELEGRAM_CHAT_ID not set`);
      return;
    }

    console.log(`[TG] Order #${orderId}: → ${targets.join(', ')} (${targets.length} recipient(s))`);

    const results = await Promise.allSettled(
      targets.map((chatId) => axios.post(url, { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard })),
    );

    for (const r of results) {
      if (r.status === 'rejected') {
        const detail = r.reason?.response?.data ?? r.reason?.message ?? r.reason;
        console.error('[TG] send failed:', JSON.stringify(detail));
      }
    }
  } catch (e: any) {
    console.error('[TG] sendOrderNotification crashed:', e?.message ?? e);
  }
};
