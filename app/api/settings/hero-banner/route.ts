import { prisma } from '@/back/prisma/prisma-client';
import { NextResponse } from 'next/server';

// Без этого Vercel кэширует GET-ответ на этапе билда и баннер не обновляется
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.setting.findFirst({ where: { id: 1 } });
    const pathname = settings?.heroBannerUrl ?? null;

    if (!pathname) {
      return NextResponse.json({ heroBannerUrl: null });
    }

    // If it's a Vercel Blob private URL (starts with blob path), generate a download URL
    if (pathname.startsWith('uploads/') && process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { list } = await import('@vercel/blob');
        const { blobs } = await list({ prefix: pathname, limit: 1 });
        if (blobs[0]) {
          return NextResponse.json({ heroBannerUrl: blobs[0].downloadUrl });
        }
      } catch {
        // fall through to raw pathname
      }
    }

    return NextResponse.json({ heroBannerUrl: pathname });
  } catch {
    return NextResponse.json({ heroBannerUrl: null });
  }
}
