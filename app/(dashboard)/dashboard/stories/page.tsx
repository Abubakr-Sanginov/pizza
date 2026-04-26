import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteStory } from '@/back/actions/story-actions';
import Link from 'next/link';

export default async function StoriesPage() {
  const stories = await prisma.story.findMany({
    include: {
      items: true,
    },
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text="Управление сториз" size="lg" className="font-bold" />
        <Link href="/dashboard/stories/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            Добавить историю
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-4 font-bold text-gray-600">ID</th>
              <th className="px-6 py-4 font-bold text-gray-600">Превью</th>
              <th className="px-6 py-4 font-bold text-gray-600">Кол-во слайдов</th>
              <th className="px-6 py-4 font-bold text-gray-600">Дата создания</th>
              <th className="px-6 py-4 font-bold text-gray-600 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-500">#{item.id}</td>
                <td className="px-6 py-4">
                  <img src={item.previewImageUrl} alt="Preview" className="w-12 h-16 object-cover rounded-md border" />
                </td>
                <td className="px-6 py-4 font-medium">{item.items.length} слайдов</td>
                <td className="px-6 py-4 text-gray-400 text-sm">
                  {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DeleteButton id={item.id} deleteAction={deleteStory} entityName="историю" />
                  </div>
                </td>
              </tr>
            ))}
            {stories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Историй пока нет. Нажмите «Добавить историю», чтобы создать первую.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

