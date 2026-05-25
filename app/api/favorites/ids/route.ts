import { NextResponse } from "next/server";

import { prisma } from "@/back/prisma/prisma-client";
import { getUserSession } from "@/back/lib/get-user-session";

/**
 * Lightweight endpoint that returns just IDs of favorited products
 * for the current user — used to populate UI state on initial load.
 */
export async function GET() {
  try {
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json([]);
    }

    const rows = await prisma.favorite.findMany({
      where: { userId: Number(session.id) },
      select: { productId: true },
    });

    return NextResponse.json(rows.map((r) => r.productId));
  } catch (error) {
    console.error("[FAVORITES_IDS_GET]", error);
    return NextResponse.json([]);
  }
}
