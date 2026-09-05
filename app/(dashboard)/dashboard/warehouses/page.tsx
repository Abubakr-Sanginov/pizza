export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { WarehouseStockTable } from '@/shared/components/shared/admin/warehouse-stock-table';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function WarehousesPage() {
  const t = getAdminT();
  const products = await prisma.product.findMany({
    include: {
      category: true,
      items: true,
    },
    orderBy: { id: 'asc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text={t('admin.warehouses.title')} size="lg" className="font-bold" />
      </div>

      <WarehouseStockTable
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          imageUrl: p.imageUrl,
          categoryName: p.category.name,
          items: p.items.map((it) => ({ id: it.id, size: it.size, price: it.price, stock: it.stock })),
        }))}
      />
    </div>
  );
}
