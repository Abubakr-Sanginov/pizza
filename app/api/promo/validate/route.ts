import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { applyPromo } from '@/back/lib/promo';

const Body = z.object({
  code: z.string().trim().min(1).max(50),
  subtotal: z.coerce.number().int().min(0),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        lineTotal: z.coerce.number().min(0),
      }),
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Bad request' },
      { status: 400 },
    );
  }
  const result = await applyPromo(parsed.data.code, parsed.data.subtotal, parsed.data.items);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    code: result.promo.code,
    type: result.promo.type,
    discountValue: result.promo.discount,
    description: result.promo.description,
    appliedDiscount: result.discount,
    scopedSubtotal: result.scopedSubtotal,
  });
}
