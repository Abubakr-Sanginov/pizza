const STORE_ID = process.env.YOOKASSA_STORE_ID || '';
const API_KEY = process.env.YOOKASSA_API_KEY || '';
const CONFIGURED = !!STORE_ID && !!API_KEY;
const MOCK_MODE = !CONFIGURED;

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${STORE_ID}:${API_KEY}`).toString('base64');
}

export interface YooKassaPaymentResponse {
  id: string;
  status: string;
  confirmation?: {
    type: string;
    confirmation_url: string;
  };
  amount: {
    value: string;
    currency: string;
  };
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface YooKassaInitPayload {
  amount: number;
  currency?: string;
  description: string;
  confirmationUrl: string;
  metadata?: Record<string, any>;
}

export async function createYooKassaPayment(
  payload: YooKassaInitPayload,
): Promise<YooKassaPaymentResponse> {
  if (MOCK_MODE) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    return {
      id: `MOCK_${Date.now()}`,
      status: 'pending',
      confirmation: {
        type: 'redirect',
        confirmation_url: `${siteUrl}/mock-yookassa?order_id=${payload.metadata?.orderId || 0}&amount=${payload.amount.toFixed(2)}&return_url=${encodeURIComponent(payload.confirmationUrl)}`,
      },
      amount: {
        value: payload.amount.toFixed(2),
        currency: payload.currency || 'RUB',
      },
      description: payload.description,
      metadata: payload.metadata,
      created_at: new Date().toISOString(),
    };
  }

  const idempotenceKey = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
    },
    body: JSON.stringify({
      amount: {
        value: payload.amount.toFixed(2),
        currency: payload.currency || 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: payload.confirmationUrl,
      },
      capture: true,
      description: payload.description,
      metadata: payload.metadata || {},
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YooKassa API error ${res.status}: ${err}`);
  }

  return res.json();
}

export async function getYooKassaPayment(
  paymentId: string,
): Promise<YooKassaPaymentResponse> {
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader(),
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`YooKassa API error ${res.status}: ${err}`);
  }

  return res.json();
}

export const yookassaConfigured = CONFIGURED;
export const yookassaMockMode = MOCK_MODE;
