import crypto from 'crypto';

const SECRET = process.env.PAYMENT_INTERNAL_SECRET || process.env.NEXTAUTH_SECRET || 'change-me';

export function signOrder(orderId: number, method: 'STARS' | 'TRANSFER') {
  const payload = `${orderId}.${method}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex').slice(0, 16);
  return `${orderId}_${method}_${sig}`;
}

export function verifyOrder(token: string): { orderId: number; method: 'STARS' | 'TRANSFER' } | null {
  const parts = token.split('_');
  if (parts.length !== 3) return null;
  const [idStr, method, sig] = parts;
  if (method !== 'STARS' && method !== 'TRANSFER') return null;
  const orderId = Number(idStr);
  if (!Number.isFinite(orderId)) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`${orderId}.${method}`).digest('hex').slice(0, 16);
  if (sig !== expected) return null;
  return { orderId, method };
}
