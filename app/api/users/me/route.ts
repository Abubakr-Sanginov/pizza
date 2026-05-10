import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { hashSync } from 'bcrypt';
import { z } from 'zod';

const PatchBody = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  password: z.string().min(6).max(72).optional(),
  address: z.string().trim().max(500).optional(),
  // email change is intentionally NOT supported here — would require
  // re-verification flow (otherwise account takeover via session).
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ message: 'Вы не авторизованы' }, { status: 401 });
    }

    const parsed = PatchBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? 'Bad request' },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const userId = Number(session.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName ?? user.fullName,
        password: data.password ? hashSync(data.password, 10) : user.password,
        address: data.address ?? user.address,
      },
    });

    const { password: _password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error [USER_PATCH]', error);
    return NextResponse.json({ message: 'Ошибка при обновлении профиля' }, { status: 500 });
  }
}
