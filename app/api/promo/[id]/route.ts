import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/back/prisma/prisma-client';
import { authOptions } from '@/shared/constants/auth-options';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await prisma.promoCode.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.active === 'boolean') data.active = body.active;
  if (typeof body.usageLimit === 'number') data.usageLimit = body.usageLimit;
  if (Array.isArray(body.productIds)) {
    data.productIds = body.productIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0);
  }
  if (Array.isArray(body.categoryIds)) {
    data.categoryIds = body.categoryIds.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n) && n > 0);
  }
  const updated = await prisma.promoCode.update({ where: { id }, data });
  return NextResponse.json(updated);
}
