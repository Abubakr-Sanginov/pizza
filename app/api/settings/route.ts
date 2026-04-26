import { prisma } from '@/back/prisma/prisma-client';
import { NextResponse } from 'next/server';

export async function GET() {
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

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
