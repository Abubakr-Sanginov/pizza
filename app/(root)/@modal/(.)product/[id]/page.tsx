import { ChooseProductModal } from '@/shared/components/shared';
import { prisma } from '@/back/prisma/prisma-client';
import { notFound } from 'next/navigation';

export default async function ProductModalPage({ params: { id } }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: {
      id: Number(id),
    },
    include: {
      ingredients: true,
      items: true,
      reviews: {
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!product) {
    return notFound();
  }

  return <ChooseProductModal product={product} />;
}
