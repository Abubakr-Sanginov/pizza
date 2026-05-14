import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { findOrCreateCart } from '@/back/lib/find-or-create-cart';
import { updateCartTotalAmount } from '@/back/lib/update-cart-total-amount';

/**
 * Clones items from a previous order back into the user's cart.
 * Skips items whose ProductItem or ingredients no longer exist (silently).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = Number(params.id);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: Number(session.id) },
    });
    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    type OrderItem = {
      quantity: number;
      productItem?: { id?: number };
      ingredients?: Array<{ id: number }>;
    };
    let parsed: OrderItem[] = [];
    try {
      const raw = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items as any);
      parsed = Array.isArray(raw) ? raw : [];
    } catch {
      return NextResponse.json({ error: 'Битый заказ' }, { status: 500 });
    }

    let token =
      req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token') || undefined;
    if (!token) token = crypto.randomUUID();

    const cart = await findOrCreateCart(token);

    let added = 0;
    let skipped = 0;
    for (const item of parsed) {
      const productItemId = item.productItem?.id;
      if (!productItemId) {
        skipped++;
        continue;
      }
      const exists = await prisma.productItem.findUnique({ where: { id: productItemId } });
      if (!exists) {
        skipped++;
        continue;
      }
      const ingredientIds = (item.ingredients || []).map((i) => i.id);
      const validIngredients = ingredientIds.length
        ? (
            await prisma.ingredient.findMany({
              where: { id: { in: ingredientIds } },
              select: { id: true },
            })
          ).map((i) => i.id)
        : [];

      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productItemId,
          quantity: item.quantity || 1,
          ingredients: { connect: validIngredients.map((id) => ({ id })) },
        },
      });
      added++;
    }

    const updated = await updateCartTotalAmount(token);
    const res = NextResponse.json({ ok: true, added, skipped, cart: updated });
    res.cookies.set('cartToken', token);
    return res;
  } catch (error) {
    console.error('[ORDER_REPEAT]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
