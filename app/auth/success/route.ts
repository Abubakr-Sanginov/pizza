import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';
import { signMobileAuthToken } from '@/back/lib/mobile-auth-token';

export const dynamic = 'force-dynamic';

/**
 * OAuth-мост для мобильного приложения. После входа через Google/GitHub
 * NextAuth приводит браузер сюда, а мы возвращаем в приложение (exp:// / nextapp://)
 * короткоживущий подписанный токен вместо сырых данных пользователя.
 */
export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('redirect');

  if (!target || !/^exp:\/\/|^nextapp:\/\//i.test(target)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const url = new URL(target);
  url.searchParams.set('t', signMobileAuthToken(session.user.id));
  return NextResponse.redirect(url.toString());
}
