'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { UserRole } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getUserSession } from '@/back/lib/get-user-session';

export async function updateUserData(userId: number, data: { role?: UserRole; telegramUsername?: string | null }) {
  try {
    const session = await getUserSession();

    if (!session || session.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('[UPDATE_USER_DATA]', error);
    return { success: false, message: 'Failed to update user data' };
  }
}
