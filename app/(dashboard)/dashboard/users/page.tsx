export const dynamic = 'force-dynamic';

import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { UserRole } from '@prisma/client';
import { updateUserData } from './actions';
import { revalidatePath } from 'next/cache';
import { getAdminT } from '@/shared/lib/admin-i18n';

export default async function DashboardUsersPage() {
  const t = getAdminT();
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      <Title text={t('admin.users.title')} size="lg" className="font-bold mb-10" />

      <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.common.id')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.users.userName')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.users.email')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground">{t('admin.users.role')}</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground text-right">{t('admin.common.action')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                <td className="px-6 py-4">#{user.id}</td>
                <td className="px-6 py-4 font-medium">{user.fullName}</td>
                <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300' :
                    user.role === 'COURIER' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300' :
                    'bg-muted text-foreground'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <form action={async (formData) => {
                      'use server';
                      const role = formData.get('role') as UserRole;
                      await updateUserData(user.id, { role });
                      revalidatePath('/dashboard/users');
                   }} className="flex justify-end gap-2">
                      <select name="role" defaultValue={user.role} className="text-xs border border-border bg-background rounded px-1 py-1">
                         <option value="USER">USER</option>
                         <option value="COURIER">COURIER</option>
                         <option value="ADMIN">ADMIN</option>
                      </select>
                      <button type="submit" className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90">
                         {t('admin.common.save')}
                      </button>
                   </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
