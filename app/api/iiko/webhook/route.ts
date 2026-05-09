import { NextRequest, NextResponse } from 'next/server';
import { IikoSyncService } from '@/back/services/iiko-sync';
import { prisma } from '@/back/prisma/prisma-client';

/**
 * Эндпоинт для приема вебхуков от iikoCloud.
 * Сюда iiko отправляет POST-запросы при любом изменении меню или стоп-листов.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[IIKO WEBHOOK] Received event:', body.eventType || 'Unknown Event');

    // Если iiko присылает событие об изменении меню или стоп-листа
    if (body.eventType === 'MenuUpdate' || body.eventType === 'StopListUpdate') {
      console.log('[IIKO WEBHOOK] Triggering automatic menu synchronization...');
      IikoSyncService.syncMenu()
        .then(res => console.log('[IIKO WEBHOOK] Auto-sync finished:', res))
        .catch(err => console.error('[IIKO WEBHOOK] Auto-sync failed:', err));
    }

    // Обработка изменения статуса заказа в iiko
    if (body.eventType === 'DeliveryStatusUpdate' && body.eventInfo) {
      const { orderId: iikoOrderId, status: iikoStatus, courierId: iikoCourierId } = body.eventInfo;
      console.log(`[IIKO WEBHOOK] Order ${iikoOrderId} changed status to ${iikoStatus}`);

      // Маппинг статусов iiko в наши статусы
      const statusMap: Record<string, any> = {
        'Unconfirmed': 'PENDING',
        'WaitCooking': 'PENDING',
        'ReadyForCooking': 'PENDING',
        'CookingStarted': 'COOKING',
        'CookingCompleted': 'READY',
        'Waiting': 'READY',
        'OnWay': 'DELIVERING',
        'Delivered': 'SUCCEEDED',
        'Cancelled': 'CANCELLED',
      };

      const localStatus = statusMap[iikoStatus];

      if (localStatus) {
        // Ищем заказ по iikoOrderId
        const order = await prisma.order.findFirst({
           where: { iikoOrderId: iikoOrderId }
        });

        if (order) {
           const updateData: any = { status: localStatus };

           // Если в iiko назначен курьер, пробуем найти его у нас
           if (iikoCourierId) {
              const courier = await prisma.user.findFirst({
                 where: { iikoId: iikoCourierId }
              });
              if (courier) {
                 updateData.courierId = courier.id;
              }
           }

           await prisma.order.update({
              where: { id: order.id },
              data: updateData
           });
           
           console.log(`[IIKO WEBHOOK] Updated local order ${order.id} status to ${localStatus}`);
        }
      }
    }

    // Возвращаем 200 OK, чтобы iiko понял, что мы успешно приняли вебхук
    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('[IIKO WEBHOOK ERROR]', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
