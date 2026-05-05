import { NextRequest, NextResponse } from 'next/server';
import { IikoSyncService } from '@/back/services/iiko-sync';

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
      
      // Запускаем полную синхронизацию в фоновом режиме
      // Не ждем ответа, чтобы iiko сразу получил статус 200 OK
      IikoSyncService.syncMenu()
        .then(res => console.log('[IIKO WEBHOOK] Auto-sync finished:', res))
        .catch(err => console.error('[IIKO WEBHOOK] Auto-sync failed:', err));
    }

    // Возвращаем 200 OK, чтобы iiko понял, что мы успешно приняли вебхук
    return NextResponse.json({ success: true, message: 'Webhook received' });
  } catch (error: any) {
    console.error('[IIKO WEBHOOK ERROR]', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
