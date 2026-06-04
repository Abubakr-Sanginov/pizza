import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { hashSync } from 'bcrypt';
import { z } from 'zod';

import { sendEmail } from '@/back/lib/send-email';
import { VerificationUserTemplate } from '@/shared/components/shared/email-temapltes/verification-user';
import React from 'react';

const RegisterBody = z.object({
  email: z.string().email('Неверный формат email').max(255),
  fullName: z.string().trim().min(2, 'Имя слишком короткое').max(100),
  password: z.string().min(6, 'Пароль минимум 6 символов').max(72),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = RegisterBody.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Bad request' },
        { status: 400 },
      );
    }
    const { email, fullName, password } = parsed.data;

    const user = await prisma.user.findFirst({ where: { email } });

    if (user) {
      if (!user.verified) {

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await prisma.verificationCode.upsert({
          where: { userId: user.id },
          create: { code, userId: user.id },
          update: { code, createdAt: new Date() },
        });
        await sendEmail(
          email,
          'Next Pizza / 📝 Подтверждение регистрации',
          VerificationUserTemplate({ code }) as React.ReactElement,
        );
        return NextResponse.json({ success: true, resent: true });
      }
      return NextResponse.json({ error: 'Пользователь уже существует' }, { status: 400 });
    }

    const createdUser = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashSync(password, 10),
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await prisma.verificationCode.create({
      data: { code, userId: createdUser.id },
    });

    await sendEmail(
      createdUser.email,
      'Next Pizza / 📝 Подтверждение регистрации',
      VerificationUserTemplate({ code }) as React.ReactElement,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[REGISTER_API]', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
