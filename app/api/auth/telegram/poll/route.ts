import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { hashSync } from 'bcrypt';

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const session = await prisma.telegramAuthSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session.confirmed || !session.telegramId) {
      return NextResponse.json({ confirmed: false });
    }

    const telegramId = session.telegramId;

    let user = await prisma.user.findFirst({
      where: { provider: 'telegram', providerId: telegramId },
    });

    if (!user) {
      const email = `tg_${telegramId}@telegram.auth`;
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'telegram',
          providerId: telegramId,
          verified: user.verified || new Date(),
        },
      });
    } else {
      const email = `tg_${telegramId}@telegram.auth`;
      user = await prisma.user.create({
        data: {
          email,
          fullName: `TG User ${telegramId}`,
          password: hashSync(telegramId, 10),
          verified: new Date(),
          provider: 'telegram',
          providerId: telegramId,
        },
      });
    }

    await prisma.telegramAuthSession.delete({ where: { token } });

    return NextResponse.json({
      confirmed: true,
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (error) {
    console.error('Error [TELEGRAM_AUTH_POLL]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
