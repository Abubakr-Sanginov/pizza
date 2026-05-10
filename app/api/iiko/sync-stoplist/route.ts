import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

import { syncStopList } from '@/back/services/iiko';
import { getUserSession } from '@/back/lib/get-user-session';

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || req.nextUrl.searchParams.get('secret');

  if (cronSecret && provided === cronSecret) {
    return runSync();
  }

  const session = await getUserSession();
  if (!session || session.role !== UserRole.ADMIN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  return runSync();
}

async function runSync() {
  try {
    const result = await syncStopList();
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[IIKO STOPLIST]', error);
    return NextResponse.json({ ok: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}
