import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const response = NextResponse.next();

  const isAllowed =
    !origin ||
    ALLOWED_ORIGINS.some((allowed) => origin === allowed) ||
    origin.startsWith('http://localhost') ||
    origin.startsWith('exp://');

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Cart-Token, Authorization');
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
