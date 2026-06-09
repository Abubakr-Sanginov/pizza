export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteStory } from '@/back/actions/story-actions';
import Link from 'next/link';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function StoriesPage() {
  const t = getAdminT();
  const stories = await prisma.story.findMany({
    include: {
      items: true,
    },
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text={t('admin.stories.title')} size="lg" className="font-bold" />
        <Link href="/dashboard/stories/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            {t('admin.stories.add')}
          </Button>
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.id')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.stories.preview')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.stories.slidesCount')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.stories.createdAt')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground text-right">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
                <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                <td className="px-6 py-4">
                  <img src={item.previewImageUrl} alt="Preview" className="w-12 h-16 object-cover rounded-md border border-border" />
                </td>
                <td className="px-6 py-4 font-medium">{item.items.length} {t('admin.stories.slides')}</td>
                <td className="px-6 py-4 text-muted-foreground text-sm">
                  {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DeleteButton id={item.id} deleteAction={deleteStory} entityName={t('admin.stories.entityName')} />
                  </div>
                </td>
              </tr>
            ))}
            {stories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                  {t('admin.stories.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

