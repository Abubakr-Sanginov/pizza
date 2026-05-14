import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { prisma } from '@/back/prisma/prisma-client';
import { authOptions } from '@/shared/constants/auth-options';

const CreateBody = z.object({
  code: z.string().trim().min(2).max(50),
  description: z.string().trim().max(255).optional(),
  type: z.enum(['PERCENT', 'FIXED']),
  discount: z.coerce.number().int().min(1),
  minAmount: z.coerce.number().int().min(0).optional().default(0),
  usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  active: z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session && session.user.role === 'ADMIN' ? session : null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const list = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Bad request' },
      { status: 400 },
    );
  }

  if (parsed.data.type === 'PERCENT' && parsed.data.discount > 100) {
    return NextResponse.json({ error: 'Процент не может быть больше 100' }, { status: 400 });
  }

  try {
    const created = await prisma.promoCode.create({
      data: {
        ...parsed.data,
        code: parsed.data.code.toUpperCase(),
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });
    return NextResponse.json(created);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Такой код уже существует' }, { status: 409 });
    }
    console.error('[PROMO_CREATE]', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
