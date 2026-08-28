import { NextResponse } from 'next/server';

export async function GET() {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const blobTokenPreview = process.env.BLOB_READ_WRITE_TOKEN
    ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 20) + '...'
    : 'NOT SET';

  // Try to detect if blob store is public or private by attempting a test upload
  let blobStoreAccess: string = 'unknown';
  let blobTestError: string | null = null;

  if (hasBlobToken) {
    try {
      const { put } = await import('@vercel/blob');
      // Try public first
      const testBuf = Buffer.from('test');
      try {
        await put('test-public.txt', testBuf, {
          access: 'public',
          addRandomSuffix: true,
        });
        blobStoreAccess = 'public';
      } catch (e: any) {
        if (e?.message?.includes('private store')) {
          blobStoreAccess = 'private';
        } else if (e?.message?.includes('already exists')) {
          blobStoreAccess = 'public (file already exists from prior test)';
        } else {
          blobTestError = e?.message || String(e);
        }
      }
    } catch (e: any) {
      blobTestError = e?.message || String(e);
    }
  }

  return NextResponse.json({
    hasBlobToken,
    blobTokenPreview,
    blobStoreAccess,
    blobTestError,
    nodeEnv: process.env.NODE_ENV,
  });
}
