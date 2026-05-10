import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import webpush from 'web-push';

import { prisma } from '@/back/prisma/prisma-client';

const expo = new Expo();

const VAPID_PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIV = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:no-reply@example.com';

if (VAPID_PUB && VAPID_PRIV) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUB, VAPID_PRIV);
} else {
  console.warn(
    '[push] VAPID keys missing — web push disabled. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY in env.',
  );
}

export interface SendPushPayload {
  title: string;
  body: string;
  imageUrl?: string | null;
  url?: string;
  data?: Record<string, unknown>;
  /** Maps to Android notification channel: 'default' | 'orders' */
  channel?: 'default' | 'orders';
}

export interface SendPushSummary {
  expoSent: number;
  expoFailed: number;
  webSent: number;
  webFailed: number;
  removedTokens: number;
  receiptIds?: string[];
  noDevices?: boolean;
}

interface SendOptions {
  userIds?: number[];
  recordNotification?: boolean;
}

export async function sendPushToUsers(
  payload: SendPushPayload,
  options: SendOptions = {},
): Promise<SendPushSummary> {
  const { userIds, recordNotification = false } = options;

  if (recordNotification) {
    await prisma.notification.create({
      data: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl ?? null,
      },
    });
  }

  const where = userIds && userIds.length > 0 ? { userId: { in: userIds } } : {};
  const tokens = await prisma.pushToken.findMany({ where });

  const summary: SendPushSummary = {
    expoSent: 0,
    expoFailed: 0,
    webSent: 0,
    webFailed: 0,
    removedTokens: 0,
    receiptIds: [],
  };

  if (tokens.length === 0) {
    summary.noDevices = true;
    return summary;
  }

  const channelId = payload.channel || 'default';
  const expoMessages: ExpoPushMessage[] = [];
  const expoTokenIds: number[] = [];
  const webPromises: Promise<void>[] = [];

  for (const t of tokens) {
    if (t.platform === 'web') {
      webPromises.push(
        sendWeb(t.id, t.token, payload).then(
          () => {
            summary.webSent++;
          },
          async (err) => {
            summary.webFailed++;
            if (await maybeRemoveInvalidWebToken(t.id, err)) summary.removedTokens++;
          },
        ),
      );
    } else if (Expo.isExpoPushToken(t.token)) {
      const message: ExpoPushMessage = {
        to: t.token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: { url: payload.url || '/', ...(payload.data || {}) },
        priority: 'high',
        channelId,
        ttl: 60 * 60 * 24, // 24h — drop if device offline beyond
        mutableContent: true, // iOS: allow Notification Service Extension to modify
        ...(payload.imageUrl
          ? {
              richContent: { image: payload.imageUrl },
            }
          : {}),
        // iOS: automatically increment app icon badge
        badge: 1,
      } as ExpoPushMessage;
      expoMessages.push(message);
      expoTokenIds.push(t.id);
    }
  }

  await Promise.all(webPromises);

  if (expoMessages.length > 0) {
    const chunks = expo.chunkPushNotifications(expoMessages);
    let messageIndex = 0;
    for (const chunk of chunks) {
      let tickets: ExpoPushTicket[] = [];
      try {
        tickets = await expo.sendPushNotificationsAsync(chunk);
      } catch (e) {
        summary.expoFailed += chunk.length;
        messageIndex += chunk.length;
        console.error('[push] expo chunk failed', e);
        continue;
      }
      for (const ticket of tickets) {
        const tokenId = expoTokenIds[messageIndex++];
        if (ticket.status === 'ok') {
          summary.expoSent++;
          if ('id' in ticket && typeof (ticket as any).id === 'string') {
            summary.receiptIds!.push((ticket as any).id);
          }
        } else {
          summary.expoFailed++;
          const errCode = (ticket.details as any)?.error;
          // Hard delete obviously dead tokens
          if (
            (errCode === 'DeviceNotRegistered' ||
              errCode === 'InvalidCredentials' ||
              errCode === 'MismatchSenderId') &&
            tokenId
          ) {
            await prisma.pushToken.delete({ where: { id: tokenId } }).catch(() => {});
            summary.removedTokens++;
          }
          if (ticket.status === 'error') {
            console.warn('[push] expo ticket error', errCode, (ticket as any).message);
          }
        }
      }
    }
  }

  // Schedule receipt verification ~30s later (fire-and-forget).
  // Expo recommends waiting before fetching receipts.
  if (summary.receiptIds && summary.receiptIds.length > 0) {
    const idsCopy = [...summary.receiptIds];
    setTimeout(() => {
      verifyReceipts(idsCopy).catch((e) => console.error('[push] verifyReceipts crashed', e));
    }, 30_000);
  }

  return summary;
}

async function verifyReceipts(receiptIds: string[]) {
  const chunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk);
      for (const id of Object.keys(receipts)) {
        const r = receipts[id];
        if (r.status === 'error') {
          const errCode = (r.details as any)?.error;
          console.warn(`[push] receipt ${id} error: ${errCode} — ${r.message ?? ''}`);
        }
      }
    } catch (e) {
      console.error('[push] getPushNotificationReceiptsAsync failed', e);
    }
  }
}

async function sendWeb(_tokenId: number, raw: string, payload: SendPushPayload) {
  const subscription = JSON.parse(raw);
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: payload.title,
      body: payload.body,
      imageUrl: payload.imageUrl,
      url: payload.url || '/',
      icon: '/logo.png',
      data: payload.data,
    }),
    { TTL: 60 * 60 * 24, urgency: 'high' },
  );
}

async function maybeRemoveInvalidWebToken(id: number, err: any): Promise<boolean> {
  const status = err?.statusCode;
  const body = (err?.body || err?.message || '').toString();
  const invalid =
    status === 404 ||
    status === 410 ||
    /curve|Authorization|correspond|signature|expired|VAPID/i.test(body);
  if (!invalid) return false;
  await prisma.pushToken.delete({ where: { id } }).catch(() => {});
  return true;
}
