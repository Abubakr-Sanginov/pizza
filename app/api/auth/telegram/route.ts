import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/back/prisma/prisma-client';
import { hashSync } from 'bcrypt';

const BOT_TOKEN = process.env.PAYMENTS_BOT_TOKEN || '';

function verifyTelegramAuth(data: Record<string, string>): boolean {
  const { hash, ...rest } = data;
  if (!hash || !BOT_TOKEN) return false;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  return hmac === hash;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, first_name, last_name, username, photo_url, auth_date } = body;

    if (!id || !auth_date || !first_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!verifyTelegramAuth(body)) {
      return NextResponse.json({ error: 'Invalid hash' }, { status: 403 });
    }

    const authDateTs = Number(auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDateTs > 300) {
      return NextResponse.json({ error: 'Auth data expired' }, { status: 403 });
    }

    const telegramId = String(id);
    const fullName = [first_name, last_name].filter(Boolean).join(' ') || `TG User ${id}`;
    const email = `tg_${id}@telegram.auth`;
    const photo = photo_url || null;

    let user = await prisma.user.findFirst({
      where: { provider: 'telegram', providerId: telegramId },
    });

    if (!user) {
      user = await prisma.user.findFirst({ where: { email } });
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          provider: 'telegram',
          providerId: telegramId,
          fullName: user.fullName || fullName,
          verified: user.verified || new Date(),
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          password: hashSync(telegramId, 10),
          verified: new Date(),
          provider: 'telegram',
          providerId: telegramId,
        },
      });
    }

    return NextResponse.json({
      email: user.email,
      name: user.fullName,
      id: user.id,
    });
  } catch (error) {
    console.error('Error [TELEGRAM_AUTH]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
