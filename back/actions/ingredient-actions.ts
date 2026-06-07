'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { aiTranslateAll } from '@/back/services/ai-translate';

export async function createIngredient(data: Prisma.IngredientCreateInput) {
  try {
    const ingredient = await prisma.ingredient.create({
      data,
    });

    revalidatePath('/dashboard/ingredients');
    revalidatePath('/');

    return ingredient;
  } catch (error) {
    console.error('Error [CREATE_INGREDIENT]', error);
    throw error;
  }
}

export async function updateIngredient(id: number, data: Prisma.IngredientUpdateInput) {
  try {
    const ingredient = await prisma.ingredient.update({
      where: { id },
      data,
    });

    revalidatePath('/dashboard/ingredients');
    revalidatePath('/');

    return ingredient;
  } catch (error) {
    console.error('Error [UPDATE_INGREDIENT]', error);
    throw error;
  }
}

export async function deleteIngredient(id: number) {
  try {
    await prisma.ingredient.delete({
      where: { id },
    });

    revalidatePath('/dashboard/ingredients');
    revalidatePath('/');
  } catch (error) {
    console.error('Error [DELETE_INGREDIENT]', error);
    throw error;
  }
}

