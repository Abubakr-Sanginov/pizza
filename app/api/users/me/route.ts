import { prisma } from '@/back/prisma/prisma-client';
import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/back/lib/get-user-session';
import { hashSync } from 'bcrypt';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getUserSession();

    if (!session) {
      return NextResponse.json({ message: 'Вы не авторизованы' }, { status: 401 });
    }

    const data = await req.json();
    const userId = Number(session.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Пользователь не найден' }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName || user.fullName,
        email: data.email || user.email,
        password: data.password ? hashSync(data.password, 10) : user.password,
        address: data.address || user.address,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error [USER_PATCH]', error);
    return NextResponse.json({ message: 'Ошибка при обновлении профиля' }, { status: 500 });
  }
}
