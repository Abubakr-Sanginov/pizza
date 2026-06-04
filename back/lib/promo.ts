import { PromoCode } from '@prisma/client';

import { prisma } from '@/back/prisma/prisma-client';

export interface AppliedPromo {
  promo: PromoCode;
  discount: number;
  scopedSubtotal: number;
}

export interface PromoCartItem {
  productId: number;
  lineTotal: number;
}

export async function applyPromo(
  rawCode: string,
  subtotal: number,
  items: PromoCartItem[] = [],
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

  // Determine the scoped subtotal that the promo applies to.
  const promoAny = promo as unknown as PromoCode & { productIds?: number[]; categoryIds?: number[] };
  const promoProductIds: number[] = promoAny.productIds ?? [];
  const promoCategoryIds: number[] = promoAny.categoryIds ?? [];
  const hasScope = promoProductIds.length > 0 || promoCategoryIds.length > 0;

  let scopedSubtotal = subtotal;
  if (hasScope) {
    if (items.length === 0) {
      // No items context — cannot evaluate scope, refuse
      return { error: 'Промокод действует только на отдельные товары — открой корзину' };
    }
    const allProductIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: allProductIds } },
      select: { id: true, categoryId: true },
    });
    const categoryByProduct = new Map(products.map((p) => [p.id, p.categoryId]));

    const productSet = new Set(promoProductIds);
    const categorySet = new Set(promoCategoryIds);

    scopedSubtotal = items.reduce((sum, it) => {
      const cat = categoryByProduct.get(it.productId);
      const match = productSet.has(it.productId) || (cat != null && categorySet.has(cat));
      return match ? sum + it.lineTotal : sum;
    }, 0);

    if (scopedSubtotal <= 0) {
      return { error: 'В корзине нет товаров, на которые действует промокод' };
    }
  }

  let discount = 0;
  if (promo.type === 'PERCENT') {
    discount = Math.floor((scopedSubtotal * promo.discount) / 100);
  } else {
    discount = promo.discount;
  }
  // Never let discount exceed the scoped subtotal
  discount = Math.max(0, Math.min(discount, scopedSubtotal));

  return { promo, discount, scopedSubtotal };
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
