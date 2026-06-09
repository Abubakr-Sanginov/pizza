export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { Button } from '@/shared/components/ui';
import { Plus, Edit } from 'lucide-react';
import { DeleteButton } from '@/shared/components/shared/admin/delete-button';
import { deleteStore } from '@/back/actions/store-actions';
import Link from 'next/link';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function StoresPage() {
  const t = getAdminT();
  const stores = await prisma.store.findMany({
    orderBy: { id: 'desc' },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <Title text={t('admin.stores.title')} size="lg" className="font-bold" />
        <Link href="/dashboard/stores/new">
          <Button className="flex items-center gap-2">
            <Plus size={20} />
            {t('admin.stores.add')}
          </Button>
        </Link>
      </div>

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.id')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.common.name')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.stores.address')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground">{t('admin.stores.phone')}</th>
              <th className="px-6 py-4 font-bold text-muted-foreground text-right">{t('admin.common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((item) => (
              <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-muted transition-colors">
                <td className="px-6 py-4 text-muted-foreground">#{item.id}</td>
                <td className="px-6 py-4 font-bold">{item.name}</td>
                <td className="px-6 py-4">{item.address}</td>
                <td className="px-6 py-4 text-muted-foreground">{item.phone || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/dashboard/stores/${item.id}`}>
                      <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500/10 dark:text-blue-400">
                        <Edit size={18} />
                      </Button>
                    </Link>
                    <DeleteButton id={item.id} deleteAction={deleteStore} entityName={t('admin.stores.entityName')} />
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
