import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';

export const dynamic = 'force-dynamic';

const CUSTOM_NAME = 'Своя пицца';
const BASE_PRICES: Record<number, number> = { 20: 30, 30: 50, 40: 75 };

export async function GET() {
  try {
    const pizzaCategory = await prisma.category.findFirst({
      where: { OR: [{ id: 1 }, { name: 'Пиццы' }] },
    });
    if (!pizzaCategory) {
      return NextResponse.json({ error: 'No pizza category' }, { status: 404 });
    }

    let product = await prisma.product.findFirst({
      where: { name: CUSTOM_NAME, categoryId: pizzaCategory.id },
      include: { items: { orderBy: { size: 'asc' } } },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          name: CUSTOM_NAME,
          imageUrl: '',
          categoryId: pizzaCategory.id,
          items: {
            create: [
              { size: 20, pizzaType: 1, price: BASE_PRICES[20] },
              { size: 30, pizzaType: 1, price: BASE_PRICES[30] },
              { size: 40, pizzaType: 1, price: BASE_PRICES[40] },
            ],
          },
        },
        include: { items: { orderBy: { size: 'asc' } } },
      });
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('[CUSTOM_PIZZA_GET]', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 },
    );
  }
}
