'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { revalidatePath } from 'next/cache';

export async function createStore(data: { name: string; address: string; phone?: string; lat?: number; lng?: number }) {
  try {
    const store = await prisma.store.create({
      data,
    });

    revalidatePath('/dashboard/stores');
    return store;
  } catch (error) {
    console.error('Error [CREATE_STORE]', error);
    throw error;
  }
}

export async function updateStore(id: number, data: { name: string; address: string; phone?: string; lat?: number; lng?: number }) {
  try {
    const store = await prisma.store.update({
      where: { id },
      data,
    });

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
