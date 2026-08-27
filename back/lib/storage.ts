import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Provider-agnostic file storage.
 *
 * 1. Vercel Blob (if BLOB_READ_WRITE_TOKEN is set) — works on Vercel
 * 2. S3-compatible (if S3_BUCKET + keys are set) — works anywhere
 * 3. Local filesystem fallback — dev only
 */

const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL;
const S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE === 'true';

export const isS3Configured = Boolean(
  S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY,
);

interface PutObjectInput {
  buffer: Buffer;
  key: string;
  contentType: string;
}

export async function putObject({ buffer, key, contentType }: PutObjectInput): Promise<string> {
  console.log('[STORAGE] Provider:', BLOB_TOKEN ? 'Vercel Blob' : isS3Configured ? 'S3' : 'Local');
  if (BLOB_TOKEN) {
    return uploadToBlob({ buffer, key, contentType });
  }
  if (isS3Configured) {
    return uploadToS3({ buffer, key, contentType });
  }
  return uploadToLocal({ buffer, key });
}

async function uploadToBlob({ buffer, key, contentType }: PutObjectInput): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(key, buffer, {
    contentType,
  });
  return blob.url;
}

async function uploadToS3({ buffer, key, contentType }: PutObjectInput): Promise<string> {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT } : {}),
    forcePathStyle: S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID!,
      secretAccessKey: S3_SECRET_ACCESS_KEY!,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  if (S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
  }
  if (S3_ENDPOINT) {
    return `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${key}`;
  }
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

async function uploadToLocal({ buffer, key }: Omit<PutObjectInput, 'contentType'>): Promise<string> {
  const fileName = key.replace(/^uploads\//, '');
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, fileName), buffer);
  return `/uploads/${fileName}`;
}
