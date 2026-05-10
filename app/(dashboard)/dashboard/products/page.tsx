export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus, Edit } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteProduct } from '@/back/actions/product-actions';
import Link from 'next/link';

export default async function DashboardProducts() {
  const [products] = await Promise.all([
    prisma.product.findMany({
      include: {
        category: true,
        items: true,
      },
      orderBy: {
        id: 'desc',
      },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text="Управление продуктами" size="lg" className="font-bold" />
        <Link href="/dashboard/products/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            Добавить продукт
          </Button>
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 font-bold text-muted-foreground">ID</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">Фото</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">Название</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">Категория</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">Цены</th>
              <th className="px-6 py-4 font-bold text-muted-foreground text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
                <td className="px-6 py-4 text-muted-foreground">#{product.id}</td>
                <td className="px-6 py-4">
                  <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-lg" />
                </td>
                <td className="px-6 py-4 font-bold">{product.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{product.category.name}</td>
                <td className="px-6 py-4 text-muted-foreground">
                  {product.items.map((item) => item.price).join(', ')} TJS
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/products/${product.id}`}>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 dark:text-blue-400">
                        <Edit size={18} />
                      </Button>
                    </Link>
                    <DeleteButton id={product.id} deleteAction={deleteProduct} entityName="продукт" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

