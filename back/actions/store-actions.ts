'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { revalidatePath } from 'next/cache';

export async function createStore(data: { name: string; address: string; phone?: string; ownerUsername?: string }) {
  try {
    const { ownerUsername, ...storeData } = data;
    const store = await prisma.store.create({
      data: storeData,
    });

    if (ownerUsername) {
      await prisma.botUser.updateMany({
        where: { username: ownerUsername.replace('@', '') },
        data: { storeId: store.id },
      });
    }

    revalidatePath('/dashboard/stores');
    return store;
  } catch (error) {
    console.error('Error [CREATE_STORE]', error);
    throw error;
  }
}

export async function updateStore(id: number, data: { name: string; address: string; phone?: string; ownerUsername?: string }) {
  try {
    const { ownerUsername, ...storeData } = data;
    const store = await prisma.store.update({
      where: { id },
      data: storeData,
    });

    if (ownerUsername) {
      // Сначала отвязываем всех от этого заведения (чтобы был один хозяин)
      await prisma.botUser.updateMany({
        where: { storeId: id },
        data: { storeId: null },
      });

      // Привязываем нового
      await prisma.botUser.updateMany({
        where: { username: ownerUsername.replace('@', '') },
        data: { storeId: id },
      });
    }

    revalidatePath('/dashboard/stores');
    return store;
  } catch (error) {
    console.error('Error [UPDATE_STORE]', error);
    throw error;
  }
}

export async function deleteStore(id: number) {
  try {
    await prisma.store.delete({
      where: { id },
    });

    revalidatePath('/dashboard/stores');
  } catch (error) {
    console.error('Error [DELETE_STORE]', error);
    throw error;
  }
}

export async function getStores() {
  return prisma.store.findMany();
}
