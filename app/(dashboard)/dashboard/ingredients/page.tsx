export const dynamic = 'force-dynamic';
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus, Edit } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteIngredient } from '@/back/actions/ingredient-actions';
import Link from 'next/link';

export default async function IngredientsPage() {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text="Управление ингредиентами" size="lg" className="font-bold" />
        <Link href="/dashboard/ingredients/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            Добавить ингредиент
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4 font-bold text-gray-600">ID</th>
              <th className="px-6 py-4 font-bold text-gray-600">Фото</th>
              <th className="px-6 py-4 font-bold text-gray-600">Название</th>
              <th className="px-6 py-4 font-bold text-gray-600">Цена</th>
              <th className="px-6 py-4 font-bold text-gray-600 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {ingredients.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-500">#{item.id}</td>
                <td className="px-6 py-4">
                  <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                </td>
                <td className="px-6 py-4 font-bold">{item.name}</td>
                <td className="px-6 py-4 text-gray-600">{item.price} TJS</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/ingredients/${item.id}`}>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-50">
                        <Edit size={18} />
                      </Button>
                    </Link>
                    <DeleteButton id={item.id} deleteAction={deleteIngredient} entityName="ингредиент" />
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

