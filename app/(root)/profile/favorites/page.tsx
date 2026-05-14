import { redirect } from 'next/navigation';

import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { Container, Title, ProductCard, EmptyState } from '@/shared/components/shared';
import { Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FavoritesPage() {
  const session = await getUserSession();
  if (!session) redirect('/not-auth');

  const favorites = await prisma.favorite.findMany({
    where: { userId: Number(session.id) },
    include: {
      product: {
        include: {
          items: { orderBy: { price: 'asc' } },
          ingredients: true,
          reviews: { include: { user: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const products = favorites.map((f) => f.product);

  return (
    <Container className="mt-10 mb-20">
      <Title text="Избранное" size="lg" className="font-extrabold mb-8" />

      {products.length === 0 ? (
        <EmptyState
          icon={Heart}
          iconAccent="rose"
          title="Пока пусто"
          description="Нажимай ❤ на товарах в меню, чтобы сохранять их сюда — и быстро возвращаться к любимому."
          actionLabel="К меню"
          actionHref="/"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[40px]">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              imageUrl={product.imageUrl}
              price={product.items[0]?.price || 0}
              priceOld={product.items[0]?.priceOld}
              ingredients={product.ingredients}
              reviews={product.reviews}
              tags={(product as any).tags ?? []}
            />
          ))}
        </div>
      )}
    </Container>
  );
}
