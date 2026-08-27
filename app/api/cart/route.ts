import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findOrCreateCart } from '@/back/lib/find-or-create-cart';
import { CreateCartItemValues } from '@/back/services/dto/cart.dto';
import { updateCartTotalAmount } from '@/back/lib/update-cart-total-amount';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token');

    if (!token) {
      return NextResponse.json({ totalAmount: 0, items: [] });
    }

    const userCart = await prisma.cart.findFirst({
      where: {
        token,
      },
      include: {
        items: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            productItem: {
              include: {
                product: true,
              },
            },
            ingredients: true,
          },
        },
      },
    });

    if (!userCart) {
      return NextResponse.json({ totalAmount: 0, items: [] });
    }

    return NextResponse.json(userCart);
  } catch (error) {
    console.log('[CART_GET] Server error', error);
    return NextResponse.json({ message: 'Не удалось получить корзину' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let token = req.cookies.get('cartToken')?.value || req.headers.get('x-cart-token');

    if (!token) {
      token = crypto.randomUUID();
    }

    const userCart = await findOrCreateCart(token);
    const data = (await req.json()) as CreateCartItemValues;

    if (!data.productItemId) {
      return NextResponse.json({ message: 'productItemId обязателен' }, { status: 400 });
    }

    const productItem = await prisma.productItem.findUnique({ where: { id: Number(data.productItemId) } });
    if (!productItem) {
      return NextResponse.json({ message: 'Товар не найден' }, { status: 404 });
    }

    const customName = data.customName?.trim().slice(0, 40) || null;

    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId: userCart.id,
        productItemId: data.productItemId,
      },
      include: {
        ingredients: true,
      }
    });

    const findCartItem = cartItems.find(item => {
      const itemIngredientIds = item.ingredients.map(i => i.id).sort();
      const dataIngredientIds = [...(data.ingredients || [])].sort();
      const sameIngredients = JSON.stringify(itemIngredientIds) === JSON.stringify(dataIngredientIds);
      const sameName = (item.customName ?? null) === customName;
      return sameIngredients && sameName;
    });

    if (findCartItem) {
      const newQuantity = Math.min(findCartItem.quantity + 1, 99);
      await prisma.cartItem.update({
        where: { id: findCartItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productItemId: data.productItemId,
          quantity: 1,
          customName,
          ingredients: { connect: data.ingredients?.map((id) => ({ id })) },
        },
      });
    }

    const updatedUserCart = await updateCartTotalAmount(token);
    const resp = NextResponse.json(updatedUserCart);
    resp.cookies.set('cartToken', token);
    return resp;
  } catch (error) {
    console.log('[CART_POST] Server error', error);
    return NextResponse.json({ message: 'Не удалось добавить в корзину' }, { status: 500 });
  }
}

