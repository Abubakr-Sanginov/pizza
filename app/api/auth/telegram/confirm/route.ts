import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

const INTERNAL_SECRET = process.env.TELEGRAM_AUTH_SECRET || 'telegram-auth-secret';

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-internal-secret');
    if (secret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token, telegramId, fullName } = await req.json();

    if (!token || !telegramId) {
      return NextResponse.json({ error: 'Missing fields' }, status: 400);
    }

    const session = await prisma.telegramAuthSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.confirmed) {
      return NextResponse.json({ error: 'Already confirmed' }, { status: 400 });
    }

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.createdAt < fiveMinAgo) {
      await prisma.telegramAuthSession.delete({ where: { token } });
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }

    await prisma.telegramAuthSession.update({
      where: { token },
      data: {
        confirmed: true,
        telegramId: String(telegramId),
        fullName: fullName || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error [TELEGRAM_AUTH_CONFIRM]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
