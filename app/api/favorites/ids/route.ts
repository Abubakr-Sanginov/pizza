import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/back/prisma/prisma-client";
import { getUserSession } from "@/back/lib/get-user-session";

export async function GET(req: NextRequest) {
  try {
    const session = await getUserSession();
    let userId: number | null = session ? Number(session.id) : null;

    if (!userId) {
      const queryUserId = req.nextUrl.searchParams.get("userId");
      const token =
        req.cookies.get("cartToken")?.value || req.headers.get("x-cart-token");
      if (queryUserId && token) {
        const cart = await prisma.cart.findFirst({
          where: { token, userId: Number(queryUserId) },
          select: { userId: true },
        });
        if (cart?.userId) userId = cart.userId;
      }
    }

    if (!userId) return NextResponse.json([]);

    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { productId: true },
    });

    return NextResponse.json(rows.map((r) => r.productId));
  } catch (error) {
    console.error("[FAVORITES_IDS_GET]", error);
    return NextResponse.json([]);
  }
}
