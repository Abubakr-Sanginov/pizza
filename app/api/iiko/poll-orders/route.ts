import { NextRequest, NextResponse } from 'next/server';

import { pollPendingOrders } from '@/back/services/iiko';

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided =
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.nextUrl.searchParams.get('secret');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await pollPendingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[IIKO POLL]', error);
    return NextResponse.json({ ok: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}

export const GET = POST;
