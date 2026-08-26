import crypto from 'node:crypto';

const SECRET = process.env.NEXTAUTH_SECRET || '';
const TTL_MS = 120_000;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

/**
 * Короткоживущий подписанный токен для передачи результата OAuth-входа
 * из браузера обратно в мобильное приложение (схема nextapp://).
 */
export function signMobileAuthToken(userId: number | string): string {
  const payload = b64url(
    JSON.stringify({ uid: String(userId), exp: Date.now() + TTL_MS }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyMobileAuthToken(token: string): number | null {
  if (!SECRET || !token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload), 'base64url');
  const given = Buffer.from(signature, 'base64url');
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.uid || typeof data.exp !== 'number' || data.exp < Date.now()) {
      return null;
    }
    return Number(data.uid);
  } catch {
    return null;
  }
}
