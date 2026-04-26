'use server';

import { prisma } from '@/back/prisma/prisma-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';

export async function getSettings() {
  try {
    let settings = await prisma.setting.findFirst({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: 1,
          vatPrice: 15,
          deliveryPrice: 250,
        },
      });
    }

    return settings;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
}

export async function updateSettings(vatPrice: number, deliveryPrice: number) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      throw new Error('Access denied');
    }

    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      update: {
        vatPrice,
        deliveryPrice,
      },
      create: {
        id: 1,
        vatPrice,
        deliveryPrice,
      },
    });

    return settings;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}
