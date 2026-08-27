import { prisma } from '@/back/prisma/prisma-client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const settings = await prisma.setting.findFirst({ where: { id: 1 } });
    return NextResponse.json({ heroBannerUrl: settings?.heroBannerUrl ?? null });
  } catch {
    return NextResponse.json({ heroBannerUrl: null });
  }
}
