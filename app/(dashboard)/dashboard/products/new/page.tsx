import { prisma } from '@/back/prisma/prisma-client';
import { ProductForm } from '@/shared/components/shared/admin/product-form';
import React from 'react';

export default async function NewProductPage() {
  const [categories, ingredients] = await Promise.all([
    prisma.category.findMany(),
    prisma.ingredient.findMany(),
  ]);

  return (
    <div>
      <ProductForm categories={categories} ingredients={ingredients} />
    </div>
  );
}

