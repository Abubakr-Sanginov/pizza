export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { PromoAdmin } from '@/shared/components/shared/admin/promo-admin';

export default async function PromoPage() {
  const [promos, products, categories] = await Promise.all([
    prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({
      select: { id: true, name: true, categoryId: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <Title text="Промокоды" size="lg" className="font-bold mb-10" />
      <PromoAdmin
        initial={promos.map((p: any) => ({
          ...p,
          productIds: p.productIds ?? [],
          categoryIds: p.categoryIds ?? [],
          expiresAt: p.expiresAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
        products={products}
        categories={categories}
      />
    </div>
  );
}
