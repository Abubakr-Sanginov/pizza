'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { revalidatePath } from 'next/cache';

interface ProductItemInput {
  id?: number;
  price: number;
  priceOld?: number;
  size?: number;
  pizzaType?: number;
}

interface ProductInput {
  name: string;
  imageUrl: string;
  categoryId: number;
  ingredientIds: number[];
  items: ProductItemInput[];
}

export async function createProduct(data: ProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        category: { connect: { id: data.categoryId } },
        ingredients: {
          connect: data.ingredientIds.map((id) => ({ id })),
        },
        items: {
          create: data.items.map((item) => ({
            price: item.price,
            priceOld: item.priceOld || null,
            size: item.size || null,
            pizzaType: item.pizzaType || null,
          })),
        },
      },
    });

    revalidatePath('/dashboard/products');
    revalidatePath('/');

    return product;
  } catch (error) {
    console.error('Error [CREATE_PRODUCT]', error);
    throw error;
  }
}

export async function updateProduct(id: number, data: ProductInput) {
  try {
    // First delete CartItems referencing the old ProductItems
    const oldItems = await prisma.productItem.findMany({ where: { productId: id }, select: { id: true } });
    if (oldItems.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { productItemId: { in: oldItems.map(i => i.id) } },
      });
    }

    // Now safe to delete old items and recreate them
    await prisma.productItem.deleteMany({
      where: { productId: id },
    });

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        category: { connect: { id: data.categoryId } },
        ingredients: {
          set: data.ingredientIds.map((id) => ({ id })),
        },
        items: {
          create: data.items.map((item) => ({
            price: item.price,
            priceOld: item.priceOld || null,
            size: item.size || null,
            pizzaType: item.pizzaType || null,
          })),
        },
      },
    });

    revalidatePath('/dashboard/products');
    revalidatePath('/');

    return product;
  } catch (error) {
    console.error('Error [UPDATE_PRODUCT]', error);
    throw error;
  }
}

export async function deleteProduct(id: number) {
  try {
    // Delete CartItems referencing these ProductItems first
    const items = await prisma.productItem.findMany({ where: { productId: id }, select: { id: true } });
    if (items.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { productItemId: { in: items.map(i => i.id) } },
      });
    }

    // Now safe to delete related items
    await prisma.productItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    revalidatePath('/');
  } catch (error) {
    console.error('Error [DELETE_PRODUCT]', error);
    throw error;
  }
}

