import { NextResponse } from 'next/server';
import { Expo } from 'expo-server-sdk';
import { getServerSession } from 'next-auth';

import { prisma } from '@/back/prisma/prisma-client';
import { authOptions } from '@/shared/constants/auth-options';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await prisma.pushToken.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });

  const summary = {
    total: tokens.length,
    expo: tokens.filter((t) => t.platform !== 'web' && Expo.isExpoPushToken(t.token)).length,
    web: tokens.filter((t) => t.platform === 'web').length,
    invalidExpo: tokens.filter((t) => t.platform !== 'web' && !Expo.isExpoPushToken(t.token)).length,
    bound: tokens.filter((t) => t.userId).length,
    unbound: tokens.filter((t) => !t.userId).length,
  };

  return NextResponse.json({
    summary,
    tokens: tokens.map((t) => ({
      id: t.id,
      platform: t.platform,
      tokenPreview: t.token.slice(0, 30) + (t.token.length > 30 ? '…' : ''),
      isExpoFormat: Expo.isExpoPushToken(t.token),
      userId: t.userId,
      user: t.user,
      createdAt: t.createdAt,
    })),
  });
}
