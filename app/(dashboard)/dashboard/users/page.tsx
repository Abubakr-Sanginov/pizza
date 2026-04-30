import { prisma } from '@/back/prisma/prisma-client';
import { Title } from '@/shared/components/shared';
import { UserRole } from '@prisma/client';
import { updateUserRole } from './actions';
import { revalidatePath } from 'next/cache';

export default async function DashboardUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div>
      <Title text="Управление пользователями" size="lg" className="font-bold mb-10" />

      <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-600">ID</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Имя</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Email</th>
              <th className="px-6 py-4 font-semibold text-gray-600">Роль</th>
              <th className="px-6 py-4 font-semibold text-gray-600 text-right">Действие</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50/50">
                <td className="px-6 py-4">#{user.id}</td>
                <td className="px-6 py-4 font-medium">{user.fullName}</td>
                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                    user.role === 'COURIER' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                   <form action={async (formData) => {
                      'use server';
                      const role = formData.get('role') as UserRole;
                      const telegramUsername = formData.get('telegramUsername') as string;
                      await updateUserData(user.id, { 
                        role, 
                        telegramUsername: telegramUsername || null 
                      });
                      revalidatePath('/dashboard/users');
                   }} className="flex flex-col md:flex-row justify-end gap-2">
                      <input 
                        name="telegramUsername" 
                        defaultValue={user.telegramUsername || ''} 
                        placeholder="@username"
                        className="text-xs border rounded px-2 py-1 w-24"
                      />
                      <select name="role" defaultValue={user.role} className="text-xs border rounded px-1 py-1">
                         <option value="USER">USER</option>
                         <option value="COURIER">COURIER</option>
                         <option value="ADMIN">ADMIN</option>
                      </select>
                      <button type="submit" className="text-xs bg-primary text-white px-2 py-1 rounded hover:opacity-90">
                         Сохранить
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
