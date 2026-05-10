import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CODE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')?.trim();
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: { code },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }
    if (Date.now() - verificationCode.createdAt.getTime() > CODE_TTL_MS) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } }).catch(() => {});
      return NextResponse.json({ error: 'Срок действия кода истёк' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: verificationCode.userId },
      data: { verified: new Date() },
    });

    await prisma.verificationCode.delete({ where: { id: verificationCode.id } });

    return NextResponse.redirect(new URL('/?verified', req.url));
  } catch (error) {
    console.error('[VERIFY_GET] Server error', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

const VerifyBody = z.object({
  code: z.string().regex(/^\d{6}$/, 'Код должен быть 6 цифр'),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = VerifyBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Bad request' }, { status: 400 });
    }
    const { code, email } = parsed.data;

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: { userId: user.id, code },
    });
    if (!verificationCode) {
      return NextResponse.json({ error: 'Неверный код подтверждения' }, { status: 400 });
    }
    if (Date.now() - verificationCode.createdAt.getTime() > CODE_TTL_MS) {
      await prisma.verificationCode.delete({ where: { id: verificationCode.id } }).catch(() => {});
      return NextResponse.json({ error: 'Срок действия кода истёк' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: new Date() },
    });
    await prisma.verificationCode.delete({ where: { id: verificationCode.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[VERIFY_API]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
