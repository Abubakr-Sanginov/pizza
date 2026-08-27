import { NextResponse } from 'next/server';

export async function GET() {
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  const blobTokenPreview = process.env.BLOB_READ_WRITE_TOKEN
    ? process.env.BLOB_READ_WRITE_TOKEN.substring(0, 10) + '...'
    : 'NOT SET';

  return NextResponse.json({
    hasBlobToken,
    blobTokenPreview,
    nodeEnv: process.env.NODE_ENV,
  });
}
