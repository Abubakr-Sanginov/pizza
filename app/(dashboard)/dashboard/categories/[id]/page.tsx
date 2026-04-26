import { prisma } from '@/back/prisma/prisma-client';
import { CategoryForm } from '@/shared/components/shared/admin/category-form';
import { notFound } from 'next/navigation';
import React from 'react';

export default async function EditCategoryPage({ params: { id } }: { params: { id: string } }) {
  const category = await prisma.category.findFirst({
    where: { id: Number(id) },
  });

  if (!category) {
    return notFound();
  }

  return (
    <div>
      <CategoryForm initialData={category} />
    </div>
  );
}
