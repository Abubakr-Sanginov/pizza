import { prisma } from '@/back/prisma/prisma-client';
import { IngredientForm } from '@/shared/components/shared/admin/ingredient-form';
import { notFound } from 'next/navigation';
import React from 'react';

export default async function EditIngredientPage({ params: { id } }: { params: { id: string } }) {
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: Number(id) },
  });

  if (!ingredient) {
    return notFound();
  }

  return (
    <div>
      <IngredientForm initialData={ingredient} />
    </div>
  );
}
