import { NextRequest, NextResponse } from 'next/server';

import { retryFailedOrders } from '@/back/services/iiko';

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
    const result = await retryFailedOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[IIKO RETRY]', error);
    return NextResponse.json({ ok: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}
