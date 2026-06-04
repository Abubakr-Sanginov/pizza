import { NextResponse } from 'next/server';
import { prisma } from '@/back/prisma/prisma-client';
import { getUserSession } from '@/back/lib/get-user-session';
import { generateReferralCode } from '@/back/lib/bonus';

export async function GET() {
  const session = await getUserSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.id);
  let user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!user.referralCode) {
    let code = generateReferralCode(userId);
    while (await prisma.user.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode(userId);
    }
    user = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });
  }

  const referrals = await prisma.user.count({ where: { referredById: userId } });

  return NextResponse.json({
    code: user.referralCode,
    referralsCount: referrals,
  });
}
