import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // const code = req.nextUrl.searchParams.get('code');
    const code = '';

    if (!code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        code,
      },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: 'РќРµРІРµСЂРЅС‹Р№ РєРѕРґ' }, { status: 400 });
    }

    await prisma.user.update({
      where: {
        id: verificationCode.userId,
      },
      data: {
        verified: new Date(),
      },
    });

    await prisma.verificationCode.delete({
      where: {
        id: verificationCode.id,
      },
    });

    return NextResponse.redirect(new URL('/?verified', req.url));
  } catch (error) {
    console.error(error);
    console.log('[VERIFY_GET] Server error', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
      },
    });

    if (!verificationCode) {
      return NextResponse.json({ error: 'Неверный код подтверждения' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: new Date() },
    });

    await prisma.verificationCode.delete({
      where: { id: verificationCode.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log('Error [VERIFY_API]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
