import axios from 'axios';
import { prisma } from '@/back/prisma/prisma-client';

export const sendOrderNotification = async (
  orderId: number,
  totalAmount: number,
  fullName: string,
  phone: string,
  address: string,
  items: any[],
  storeId?: number | null,
  deliveryDetails?: { entrance?: string | null; floor?: string | null; doorCode?: string | null; apartment?: string | null }
) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const mainAdminId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.warn('Telegram bot token not found. Notification not sent.');
    return;
  }

  const itemsList = items
    .map(
      (item: any) =>
        `- ${item.productItem.product.name} (${item.productItem.size} см, ${
          item.productItem.pizzaType === 1 ? 'традиционное' : 'тонкое'
        }) x ${item.quantity}`,
    )
    .join('\n');

  const addressDetails = deliveryDetails
    ? `\n🚪 *Подъезд:* ${deliveryDetails.entrance || '-'} | *Этаж:* ${deliveryDetails.floor || '-'} | *Кв:* ${deliveryDetails.apartment || '-'}\n🔑 *Код двери:* ${deliveryDetails.doorCode || '-'}`
    : '';

  const text = `
🆕 *Новый заказ #${orderId}*

👤 *Клиент:* ${fullName}
📞 *Телефон:* ${phone}
📍 *Адрес:* ${address}${addressDetails}
💰 *Сумма:* ${totalAmount} TJS
🏢 *Заведение ID:* ${storeId || 'не указано'}

📦 *Состав заказа:*
${itemsList}
  `;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {

    const admins = await prisma.botUser.findMany({
      include: { store: true }
    });

    const notifications = [];

    for (const admin of admins) {

      const isSuper = admin.isSuperAdmin || (mainAdminId && admin.chatId === mainAdminId.toString());
      const isStoreAdmin = storeId && admin.storeId === storeId;

      if (isSuper || isStoreAdmin) {
        notifications.push(
          axios.post(url, {
            chat_id: admin.chatId,
            text,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '⏳ Готовится', callback_data: `order_status_COOKING_${orderId}` },
                  { text: '✅ Готов', callback_data: `order_status_READY_${orderId}` },
                ],
                [
                  { text: '🚚 Доставляется', callback_data: `order_status_DELIVERING_${orderId}` },
                  { text: '🏁 Завершен', callback_data: `order_status_SUCCEEDED_${orderId}` },
                ],
                [{ text: '❌ Отменить', callback_data: `order_status_CANCELLED_${orderId}` }],
              ],
            },
          })
        );
      }
    }

    // Если в БД нет админов, но есть TELEGRAM_CHAT_ID в .env - отправим хотя бы туда
    if (notifications.length === 0 && mainAdminId) {
        notifications.push(
            axios.post(url, {
              chat_id: mainAdminId,
              text,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '⏳ Готовится', callback_data: `order_status_COOKING_${orderId}` }, { text: '✅ Готов', callback_data: `order_status_READY_${orderId}` }],
                  [{ text: '🏁 Завершен', callback_data: `order_status_SUCCEEDED_${orderId}` }],
                ],
              },
            })
          );
    }

    await Promise.all(notifications);
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};
