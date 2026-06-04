import { NextRequest, NextResponse } from 'next/server';
import { IikoSyncService } from '@/back/services/iiko-sync';
import { getUserSession } from '@/back/lib/get-user-session';
import { UserRole } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {

    const session = await getUserSession();
    if (!session || session.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await IikoSyncService.syncMenu();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[SYNC API ERROR]', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
