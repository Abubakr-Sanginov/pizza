import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { hashSync } from 'bcrypt';
import { sendEmail } from '@/back/lib/send-email';
import { VerificationUserTemplate } from '@/shared/components/shared/email-temapltes/verification-user';
import React from 'react';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const user = await prisma.user.findFirst({
      where: {
        email: body.email,
      },
    });

    if (user) {
      if (!user.verified) {
        return NextResponse.json({ error: 'Почта не подтверждена' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 400 });
    }

    const createdUser = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        password: hashSync(body.password, 10),
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationCode.create({
      data: {
        code,
        userId: createdUser.id,
      },
    });

    await sendEmail(
      createdUser.email,
      'Next Pizza / 📝 Подтверждение регистрации',
      VerificationUserTemplate({
        code,
      }) as React.ReactElement,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.log('Error [REGISTER_API]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
