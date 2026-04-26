'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function createCategory(data: Prisma.CategoryCreateInput) {
  try {
    const category = await prisma.category.create({
      data,
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/');

    return category;
  } catch (error) {
    console.error('Error [CREATE_CATEGORY]', error);
    throw error;
  }
}

export async function updateCategory(id: number, data: Prisma.CategoryUpdateInput) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/');

    return category;
  } catch (error) {
    console.error('Error [UPDATE_CATEGORY]', error);
    throw error;
  }
}

export async function deleteCategory(id: number) {
  try {
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/dashboard/categories');
    revalidatePath('/');
  } catch (error) {
    console.error('Error [DELETE_CATEGORY]', error);
    throw error;
  }
}

