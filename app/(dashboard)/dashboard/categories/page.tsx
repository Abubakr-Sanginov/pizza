export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus, Edit } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteCategory } from '@/back/actions/category-actions';
import Link from 'next/link';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text="Управление категориями" size="lg" className="font-bold" />
        <Link href="/dashboard/categories/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            Добавить категорию
          </Button>
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 font-bold text-muted-foreground">ID</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">Название</th>
              <th className="px-6 py-4 font-bold text-muted-foreground text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
                <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                <td className="px-6 py-4 font-bold">{item.name}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/categories/${item.id}`}>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 dark:text-blue-400">
                        <Edit size={18} />
                      </Button>
                    </Link>
                    <DeleteButton id={item.id} deleteAction={deleteCategory} entityName="категорию" />
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

