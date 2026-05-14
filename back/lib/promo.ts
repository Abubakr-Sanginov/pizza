import { PromoCode } from '@prisma/client';

import { prisma } from '@/back/prisma/prisma-client';

export interface AppliedPromo {
  promo: PromoCode;
  discount: number; // absolute TJS off
}

/**
 * Validate and compute discount for a promo `code` against `subtotal` (in TJS).
 * Returns the applied promo with computed `discount` amount, or { error } if rejected.
 */
export async function applyPromo(
  rawCode: string,
  subtotal: number,
): Promise<AppliedPromo | { error: string }> {
  if (!rawCode || typeof rawCode !== 'string') return { error: 'Введите промокод' };
  const code = rawCode.trim().toUpperCase();

  const promo = await prisma.promoCode.findUnique({ where: { code } });
  if (!promo) return { error: 'Промокод не найден' };
  if (!promo.active) return { error: 'Промокод отключён' };
  if (promo.expiresAt && promo.expiresAt < new Date()) {
    return { error: 'Срок действия промокода истёк' };
  }
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    return { error: 'Лимит использований исчерпан' };
  }
  if (promo.minAmount > 0 && subtotal < promo.minAmount) {
    return { error: `Минимальная сумма заказа: ${promo.minAmount} TJS` };
  }

  let discount = 0;
  if (promo.type === 'PERCENT') {
    discount = Math.floor((subtotal * promo.discount) / 100);
  } else {
    discount = promo.discount;
  }
  // Never let discount exceed the subtotal
  discount = Math.max(0, Math.min(discount, subtotal));

  return { promo, discount };
}

/**
 * Increment usedCount after a successful order creation.
 */
export async function bumpPromoUsage(code: string) {
  await prisma.promoCode
    .update({
      where: { code: code.toUpperCase() },
      data: { usedCount: { increment: 1 } },
    })
    .catch((e) => console.error('[promo] usage bump failed', e));
}
