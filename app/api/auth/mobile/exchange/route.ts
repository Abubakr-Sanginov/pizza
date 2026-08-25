import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { verifyMobileAuthToken } from '@/back/lib/mobile-auth-token';

/**
 * Обмен одноразового токена из OAuth-моста (/auth/success) на профиль пользователя.
 */
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad body' }, { status: 400 });
  }

  const userId = body.token ? verifyMobileAuthToken(body.token) : null;
  if (!userId) {
    return NextResponse.json({ error: 'Ссылка входа устарела, попробуйте снова' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.verified) {
    return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
}
