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
function escapeHtmlAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

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
  const deepLink = escapeHtmlAttr(url.toString());

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0;url='${deepLink}'">
<title>Возврат в приложение...</title>
<style>
  body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fff; color: #111; }
  .card { text-align: center; padding: 32px; }
  .btn { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #ff7000; color: #fff; border-radius: 14px; text-decoration: none; font-weight: 700; }
</style>
</head>
<body>
<div class="card">
  <div style="font-size:48px">🎉</div>
  <h1 style="font-size:22px;margin:12px 0">Вход выполнен!</h1>
  <p style="color:#666">Возвращаемся в приложение...</p>
  <a class="btn" href="${deepLink}">Вернуться в приложение</a>
</div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
