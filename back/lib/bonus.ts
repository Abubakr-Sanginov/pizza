import { prisma } from '@/back/prisma/prisma-client';

export const BONUS_EARN_RATE = 0.05;
export const BONUS_MAX_SPEND_RATE = 0.5;
export const BONUS_REFERRAL_AMOUNT = 50;
export const BONUS_WELCOME_AMOUNT = 100;

function levelFor(lifetimeEarn: number) {
  if (lifetimeEarn >= 5000) return 'PLATINUM';
  if (lifetimeEarn >= 2000) return 'GOLD';
  if (lifetimeEarn >= 500) return 'SILVER';
  return 'BRONZE';
}

export async function ensureBonus(userId: number) {
  return prisma.userBonus.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

export async function getBonusBalance(userId: number) {
  const b = await ensureBonus(userId);
  return b;
}

export async function accrueBonus(opts: {
  userId: number;
  orderTotal: number;
  orderId?: number;
}) {
  const amount = Math.floor(opts.orderTotal * BONUS_EARN_RATE);
  if (amount <= 0) return null;

  const bonus = await ensureBonus(opts.userId);
  const newLifetime = bonus.lifetimeEarn + amount;

  await prisma.userBonus.update({
    where: { userId: opts.userId },
    data: {
      balance: { increment: amount },
      lifetimeEarn: { increment: amount },
      level: levelFor(newLifetime),
    },
  });

  await prisma.bonusTransaction.create({
    data: {
      userId: opts.userId,
      type: 'EARN',
      amount,
      orderId: opts.orderId,
      description: `Начислено за заказ #${opts.orderId ?? ''}`,
    },
  });

  try {
    const user = await prisma.user.findUnique({ where: { id: opts.userId } });
    if (user?.referredById) {
      const isFirstOrder = await prisma.bonusTransaction.count({
        where: { userId: opts.userId, type: 'EARN' },
      });
      if (isFirstOrder === 1) {
        await accrueDirectBonus({
          userId: user.referredById,
          amount: BONUS_REFERRAL_AMOUNT,
          type: 'REFERRAL_BONUS',
          description: `Друг сделал первый заказ #${opts.orderId ?? ''}`,
        });
      }
    }
  } catch (e) {
    console.error('[Bonus] referral payout failed', e);
  }

  return amount;
}

export async function spendBonus(opts: {
  userId: number;
  amount: number;
  orderTotal: number;
  orderId?: number;
}) {
  if (opts.amount <= 0) return 0;

  const bonus = await ensureBonus(opts.userId);
  const maxAllowed = Math.floor(opts.orderTotal * BONUS_MAX_SPEND_RATE);
  const spend = Math.min(opts.amount, bonus.balance, maxAllowed);
  if (spend <= 0) return 0;

  await prisma.userBonus.update({
    where: { userId: opts.userId },
    data: {
      balance: { decrement: spend },
      lifetimeSpent: { increment: spend },
    },
  });

  await prisma.bonusTransaction.create({
    data: {
      userId: opts.userId,
      type: 'SPEND',
      amount: -spend,
      orderId: opts.orderId,
      description: `Списано за заказ #${opts.orderId ?? ''}`,
    },
  });

  return spend;
}

export async function grantReferralBonus(opts: {
  referrerId: number;
  invitedId: number;
}) {
  await Promise.all([
    accrueDirectBonus({
      userId: opts.referrerId,
      amount: BONUS_REFERRAL_AMOUNT,
      type: 'REFERRAL_BONUS',
      description: 'Приглашённый друг сделал первый заказ',
    }),
    accrueDirectBonus({
      userId: opts.invitedId,
      amount: BONUS_WELCOME_AMOUNT,
      type: 'WELCOME',
      description: 'Приветственный бонус',
    }),
  ]);
}

export async function accrueDirectBonus(opts: {
  userId: number;
  amount: number;
  type: 'WELCOME' | 'REFERRAL_BONUS' | 'ADJUSTMENT';
  description: string;
}) {
  if (opts.amount <= 0) return;
  await ensureBonus(opts.userId);
  await prisma.userBonus.update({
    where: { userId: opts.userId },
    data: {
      balance: { increment: opts.amount },
      lifetimeEarn: { increment: opts.amount },
    },
  });
  await prisma.bonusTransaction.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      amount: opts.amount,
      description: opts.description,
    },
  });
}

export function generateReferralCode(userId: number) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${code}${userId}`;
}
