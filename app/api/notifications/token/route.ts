import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/shared/constants/auth-options';

export async function POST(req: NextRequest) {
  try {
    const { token, platform } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? Number(session.user.id) : null;

    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
      },
      create: {
        token,
        platform,
        userId,
      },
    });

    return NextResponse.json(pushToken);
  } catch (error) {
    console.error('[PUSH_TOKEN_POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
