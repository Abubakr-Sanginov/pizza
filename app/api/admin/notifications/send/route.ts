import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';

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

    // Configure Web Push if not already configured
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        'mailto:sanginovabubakr2222@gmail.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    } else {
        console.warn('VAPID keys are missing, web push will not work');
    }

    // Save notification to history
    const notification = await prisma.notification.create({
      data: { title, body, imageUrl },
    });

    // Get all tokens
    const tokens = await prisma.pushToken.findMany();

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No registered devices found' });
    }

    const expoMessages: any[] = [];
    const webPushPromises: Promise<any>[] = [];
    
    let webSuccessCount = 0;
    let webErrorCount = 0;

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
                ).then(() => {
                    webSuccessCount++;
                }).catch(err => {
                    webErrorCount++;
                    console.error('Web Push Error for token:', pushToken.id, err.statusCode, err.message);
                    // If token is invalid/expired, we should probably delete it
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        prisma.pushToken.delete({ where: { id: pushToken.id } }).catch(console.error);
                    }
                })
              );
          } catch (e) {
              console.error('Invalid web push subscription format:', pushToken.token);
              webErrorCount++;
          }
      }
    }

    // Send Expo notifications in chunks
    let expoSuccessCount = 0;
    let expoErrorCount = 0;

    if (expoMessages.length > 0) {
        const chunks = expo.chunkPushNotifications(expoMessages);
        for (const chunk of chunks) {
            try {
                const tickets = await expo.sendPushNotificationsAsync(chunk);
                tickets.forEach(ticket => {
                    if (ticket.status === 'ok') expoSuccessCount++;
                    else expoErrorCount++;
                });
            } catch (error) {
                console.error('Expo chunk error:', error);
                expoErrorCount += chunk.length;
            }
        }
    }

    await Promise.all(webPushPromises);

    return NextResponse.json({ 
        success: true, 
        count: tokens.length,
        details: {
            web: { success: webSuccessCount, error: webErrorCount },
            expo: { success: expoSuccessCount, error: expoErrorCount }
        },
        notification 
    });
  } catch (error) {
    console.error('[NOTIFICATIONS_SEND_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
