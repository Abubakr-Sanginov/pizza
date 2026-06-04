import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { ensureBonus } from '@/back/lib/bonus';

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.id);
  const bonus = await ensureBonus(userId);
  const transactions = await prisma.bonusTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return NextResponse.json({
    balance: bonus.balance,
    lifetimeEarn: bonus.lifetimeEarn,
    lifetimeSpent: bonus.lifetimeSpent,
    level: bonus.level,
    transactions,
  });
}
