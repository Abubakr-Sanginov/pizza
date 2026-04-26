import { prisma } from '@/back/prisma/prisma-client';
import { ProductForm } from '@/shared/components/shared/admin/product-form';
import { notFound } from 'next/navigation';
import React from 'react';

export default async function EditProductPage({ params: { id } }: { params: { id: string } }) {
  const [product, categories, ingredients] = await Promise.all([
    prisma.product.findFirst({
      where: { id: Number(id) },
      include: {
        items: true,
        ingredients: true,
      },
    }),
    prisma.category.findMany(),
    prisma.ingredient.findMany(),
  ]);

  if (!product) {
    return notFound();
  }

  return (
    <div>
      <ProductForm initialData={product} categories={categories} ingredients={ingredients} />
    </div>
  );
}
