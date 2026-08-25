import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { compare } from 'bcrypt';

/**
 * Вход для мобильного приложения: проверка пароля на сервере,
 * без сессионных кук (RN-клиент хранит профиль локально).
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });

  if (!user || !user.password) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  const isPasswordValid = await compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  if (!user.verified) {
    return NextResponse.json({ error: 'Подтвердите почту, чтобы войти' }, { status: 403 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
}
