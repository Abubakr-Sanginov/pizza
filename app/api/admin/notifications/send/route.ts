import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';

const expo = new Expo();

// Жестко прописанные ключи для обхода проблем с Vercel Env Vars
const VAPID_PUB = 'BOShScHe-8RIRlNSFXmTUi-6B1aragfn_Quf4eoVq4EyeghLVV1_Ocd6OEqV_fiZAYu_Md6oga5Oap9ZD61WWx4';
const VAPID_PRIV = 'b-ngCQHcrD837t7twVwbyoAosLle7J6YMI8JkQgjW9g';

const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || VAPID_PUB;
const privKey = process.env.VAPID_PRIVATE_KEY || VAPID_PRIV;

if (pubKey && privKey) {
  webpush.setVapidDetails(
    'mailto:sanginovabubakr2222@gmail.com',
    pubKey,
    privKey
  );
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, imageUrl, url } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Save notification to history
    const notification = await prisma.notification.create({
      data: { title, body, imageUrl },
    });

    const tokens = await prisma.pushToken.findMany();

    const results = {
      web: { success: 0, error: 0, details: [] as string[] },
      expo: { success: 0, error: 0, details: [] as string[] },
    };

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, results, message: 'No devices found' });
    }

    const expoMessages: any[] = [];
    const webPushPromises: Promise<any>[] = [];

    for (const pushToken of tokens) {
      if (pushToken.platform === 'web') {
        try {
          const subscription = JSON.parse(pushToken.token);
          
          webPushPromises.push(
            webpush.sendNotification(
              subscription,
              JSON.stringify({ 
                title, 
                body, 
                imageUrl, 
                url: url || '/',
                icon: '/logo.png' 
              }),
              {
                vapidDetails: {
                  subject: 'mailto:sanginovabubakr2222@gmail.com',
                  publicKey: pubKey,
                  privateKey: privKey
                }
              }
            ).then(() => {
              results.web.success++;
            }).catch(async (err: any) => {
              results.web.error++;
              const msg = err.body || err.message || 'Push service error';
              results.web.details.push(`Token ${pushToken.id}: ${msg}`);
              
              if (err.statusCode === 410 || err.statusCode === 404 || msg.includes('unauthenticated') || msg.includes('Authorization')) {
                await prisma.pushToken.delete({ where: { id: pushToken.id } }).catch(() => {});
              }
            })
          );
        } catch (e) {
          results.web.error++;
          results.web.details.push(`Token ${pushToken.id}: Invalid JSON`);
        }
      } else if (Expo.isExpoPushToken(pushToken.token)) {
        expoMessages.push({
          to: pushToken.token,
          sound: 'default',
          title,
          body,
          data: { url: url || '/', notificationId: notification.id },
        });
      }
    }

    await Promise.all(webPushPromises);

    if (expoMessages.length > 0) {
      const chunks = expo.chunkPushNotifications(expoMessages);
      for (const chunk of chunks) {
        try {
          const tickets = await expo.sendPushNotificationsAsync(chunk);
          tickets.forEach((ticket, index) => {
            if (ticket.status === 'ok') {
              results.expo.success++;
            } else {
              results.expo.error++;
              const msg = (ticket as any).details?.error || 'Expo delivery error';
              results.expo.details.push(`Expo: ${msg}`);
            }
          });
        } catch (error: any) {
          results.expo.error += chunk.length;
          results.expo.details.push(`Expo Batch Error: ${error.message}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      results,
      notification
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
