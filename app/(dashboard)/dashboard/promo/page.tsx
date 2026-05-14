export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { PromoAdmin } from '@/shared/components/shared/admin/promo-admin';

export default async function PromoPage() {
  const promos = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return (
    <div>
      <Title text="Промокоды" size="lg" className="font-bold mb-10" />
      <PromoAdmin
        initial={promos.map((p) => ({
          ...p,
          expiresAt: p.expiresAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
