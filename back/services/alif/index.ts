import crypto from 'crypto';

const TERMINAL_ID = process.env.ALIF_TERMINAL_ID || '';
const TERMINAL_PASSWORD = process.env.ALIF_TERMINAL_PASSWORD || '';
const API_URL = process.env.ALIF_API_URL || 'https://test-web.alif.tj';
const MOCK_MODE = !TERMINAL_ID || TERMINAL_ID === 'MOCK';

function hmac(data: string, key: string) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

function buildToken(orderId: string, amount: string, callbackUrl: string) {
  const hashedPassword = hmac(TERMINAL_ID, TERMINAL_PASSWORD);
  const dataToSign = `${TERMINAL_ID}${orderId}${amount}${callbackUrl}`;
  return hmac(dataToSign, hashedPassword);
}

export interface AlifInitPayload {
  orderId: string;
  amount: number;
  callbackUrl: string;
  returnUrl: string;
  info?: string;
  email?: string;
  phone?: string;
  gate?: 'korti_milli' | 'visa' | 'mastercard' | 'alif_mobi' | 'google_pay' | 'salom';
}

export interface AlifInitResponse {
  code: number;
  message: string;
  url: string;
}

export async function initAlifPayment(payload: AlifInitPayload): Promise<AlifInitResponse> {
  if (MOCK_MODE) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return {
      code: 200,
      message: 'MOCK',
      url: `${siteUrl}/mock-alif?order_id=${encodeURIComponent(payload.orderId)}&amount=${payload.amount.toFixed(2)}&return_url=${encodeURIComponent(payload.returnUrl)}`,
    };
  }

  const amountStr = payload.amount.toFixed(2);
  const token = buildToken(payload.orderId, amountStr, payload.callbackUrl);

  const body = {
    order_id: payload.orderId,
    token,
    key: TERMINAL_ID,
    callback_url: payload.callbackUrl,
    return_url: payload.returnUrl,
    amount: amountStr,
    info: payload.info ?? `Заказ ${payload.orderId}`,
    email: payload.email,
    phone: payload.phone,
    gate: payload.gate,
  };

  const res = await fetch(`${API_URL}/v2/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as AlifInitResponse;
  return data;
}

export function verifyAlifCallback(payload: {
  order_id: string;
  amount: string;
  callback_token: string;
}) {
  if (MOCK_MODE) return true;
  const hashedPassword = hmac(TERMINAL_ID, TERMINAL_PASSWORD);
  const dataToSign = `${TERMINAL_ID}${payload.order_id}${payload.amount}`;
  const expected = hmac(dataToSign, hashedPassword);
  return expected === payload.callback_token;
}

export const alifConfigured = true;
export const alifMockMode = MOCK_MODE;
