import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/back/prisma/prisma-client";
import { getUserSession } from "@/back/lib/get-user-session";

async function resolveUserId(req: NextRequest): Promise<number | null> {
  const session = await getUserSession();
  if (session) return Number(session.id);

  const queryUserId = req.nextUrl.searchParams.get("userId");
  const token =
    req.cookies.get("cartToken")?.value || req.headers.get("x-cart-token");
  if (queryUserId && token) {
    const cart = await prisma.cart.findFirst({
      where: { token, userId: Number(queryUserId) },
      select: { userId: true },
    });
    if (cart?.userId) return cart.userId;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            items: { orderBy: { price: "asc" } },
            ingredients: true,
            reviews: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(favorites.map((f) => f.product));
  } catch (error) {
    console.error("[FAVORITES_GET]", error);
    return NextResponse.json([]);
  }
}

const ToggleBody = z.object({ productId: z.coerce.number().int().positive() });

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = ToggleBody.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Bad request" },
        { status: 400 },
      );
    }

    const { productId } = parsed.data;

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    await prisma.favorite.create({ data: { userId, productId } });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("[FAVORITES_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
