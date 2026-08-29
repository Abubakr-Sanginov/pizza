import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

const BOT_USERNAME = process.env.PAYMENTS_BOT_USERNAME || 'PizzaPayNext_bot';

export async function POST(req: NextRequest) {
  try {
    const token = crypto.randomBytes(16).toString('hex');

    await prisma.telegramAuthSession.create({
      data: { token },
    });

    const botUrl = `https://t.me/${BOT_USERNAME}?start=auth_${token}`;

    return NextResponse.json({ token, botUrl });
  } catch (error) {
    console.error('Error [TELEGRAM_AUTH_START]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
