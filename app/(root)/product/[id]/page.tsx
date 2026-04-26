import { Container, ProductForm, ProductReviews } from '@/shared/components/shared';
import { prisma } from '@/back/prisma/prisma-client';
import { notFound } from 'next/navigation';

export default async function ProductPage({ params: { id } }: { params: { id: string } }) {
  const product = await prisma.product.findFirst({
    where: { id: Number(id) },
    include: {
      ingredients: true,
      category: {
        include: {
          products: {
            include: {
              items: true,
            },
          },
        },
      },
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

  return (
    <Container className="flex flex-col my-10">
      <ProductForm product={product} />
      <ProductReviews productId={product.id} reviews={product.reviews} className="mt-10 rounded-2xl border" />
    </Container>
  );
}
