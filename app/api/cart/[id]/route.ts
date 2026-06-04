import { prisma } from '@/back/prisma/prisma-client';
import { updateCartTotalAmount } from '@/back/lib/update-cart-total-amount';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PatchBody = z.object({
  quantity: z.coerce.number().int().min(1).max(99),
});

function getToken(req: NextRequest): string | null {
  return req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token') || null;
}

async function loadOwnedItem(itemId: number, token: string) {
  return prisma.cartItem.findFirst({
    where: { id: itemId, cart: { token } },
    select: { id: true, cartId: true },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Cart token not found' }, { status: 401 });
    }

    const parsed = PatchBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Bad request' },
        { status: 400 },
      );
    }

    const cartItem = await loadOwnedItem(id, token);
    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.update({
      where: { id },
      data: { quantity: parsed.data.quantity },
    });

    const updatedUserCart = await updateCartTotalAmount(token);
    return NextResponse.json(updatedUserCart);
  } catch (error) {
    console.error('[CART_PATCH] Server error', error);
    return NextResponse.json({ message: 'Не удалось обновить корзину' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Cart token not found' }, { status: 401 });
    }

    const cartItem = await loadOwnedItem(id, token);
    if (!cartItem) {
      return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await prisma.cartItem.delete({ where: { id } });

    const updatedUserCart = await updateCartTotalAmount(token);
    return NextResponse.json(updatedUserCart);
  } catch (error) {
    console.error('[CART_DELETE] Server error', error);
    return NextResponse.json({ message: 'Не удалось удалить корзину' }, { status: 500 });
  }
}
