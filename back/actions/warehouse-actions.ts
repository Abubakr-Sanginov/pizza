'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { revalidatePath } from 'next/cache';

export async function updateStock(productId: number, stock: number | null) {
  try {
    const safeStock =
      stock === null ? null : Math.max(0, Math.min(999999, Math.floor(Number(stock))));

    await prisma.productItem.updateMany({
      where: { productId },
      data: { stock: safeStock },
    });

    revalidatePath('/dashboard/warehouses');
    revalidatePath('/');
    revalidatePath('/api/products');
  } catch (error) {
    console.error('Error [UPDATE_STOCK]', error);
    throw new Error('Не удалось обновить остаток');
  }
}
