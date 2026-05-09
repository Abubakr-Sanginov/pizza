import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';

// Configure Web Push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:sanginovabubakr2222@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const expo = new Expo();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, body, imageUrl } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Save notification to history
    const notification = await prisma.notification.create({
      data: { title, body, imageUrl },
    });

    // Get all tokens
    const tokens = await prisma.pushToken.findMany();

    const expoMessages = [];
    const webPushPromises = [];

    for (const pushToken of tokens) {
      if (pushToken.platform === 'ios' || pushToken.platform === 'android') {
        if (Expo.isExpoPushToken(pushToken.token)) {
          expoMessages.push({
            to: pushToken.token,
            sound: 'default',
            title,
            body,
            data: { notificationId: notification.id },
          });
        }
      } else if (pushToken.platform === 'web') {
          try {
              const subscription = JSON.parse(pushToken.token);
              webPushPromises.push(
                webpush.sendNotification(
                    subscription,
                    JSON.stringify({ title, body, imageUrl })
                ).catch(err => console.error('Web Push Error:', err))
              );
          } catch (e) {
              console.error('Invalid web push subscription:', pushToken.token);
          }
      }
    }

    // Send Expo notifications in chunks
    const chunks = expo.chunkPushNotifications(expoMessages);
    const expoPromises = chunks.map(chunk => expo.sendPushNotificationsAsync(chunk));

    await Promise.all([...expoPromises, ...webPushPromises]);

    return NextResponse.json({ success: true, count: tokens.length });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
