import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/shared/constants/auth-options';
import { putObject } from '@/back/lib/storage';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const MAX_BYTES = 20 * 1024 * 1024;

function extFromMime(mime: string): string | null {
  switch (mime) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'image/avif':
      return '.avif';
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 });
    }

    const ext = extFromMime(file.type);
    if (!ext) {
      return NextResponse.json({ error: 'Bad extension' }, { status: 400 });
    }

    const fileName = `${crypto.randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await putObject({
      buffer,
      key: `uploads/${fileName}`,
      contentType: file.type,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error [UPLOAD_API]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
