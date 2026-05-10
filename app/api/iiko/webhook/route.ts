import { NextRequest, NextResponse } from 'next/server';

import { handleEvent, verifySignature, type IikoWebhookEvent } from '@/back/services/iiko';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-iiko-signature') || req.headers.get('x-signature');

  if (!verifySignature(rawBody, signature)) {
    console.warn('[IIKO WEBHOOK] invalid signature');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: IikoWebhookEvent;
  try {
    event = JSON.parse(rawBody) as IikoWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  try {
    const result = await handleEvent(event);
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    console.error('[IIKO WEBHOOK]', error);
    return NextResponse.json({ ok: false, error: error?.message || 'internal error' }, { status: 500 });
  }
}
