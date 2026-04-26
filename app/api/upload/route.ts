import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${crypto.randomUUID()}-${file.name}`;
    const uploadDir = join(process.cwd(), 'public/uploads');

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    const path = join(uploadDir, fileName);
    await writeFile(path, buffer);

    const imageUrl = `/uploads/${fileName}`;

    return NextResponse.json({ url: imageUrl });
  } catch (error) {
    console.error('Error [UPLOAD_API]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
