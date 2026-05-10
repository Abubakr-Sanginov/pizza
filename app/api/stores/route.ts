import { NextResponse } from 'next/server';

import { prisma } from '@/back/prisma/prisma-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        lat: true,
        lng: true,
      },
    });
    return NextResponse.json(stores);
  } catch (error) {
    console.error('[STORES_GET]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
