import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Blob not configured' }, { status: 500 });
  }

  try {
    const { get } = await import('@vercel/blob');
    const blob = await get(url);
    if (!blob || !blob.stream) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return new NextResponse(blob.stream as any, {
      headers: {
        'Content-Type': blob.contentType || 'image/gif',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}
