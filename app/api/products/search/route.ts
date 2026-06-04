import { prisma } from "@/back/prisma/prisma-client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("query") || "";

    const products = await prisma.product.findMany({
      where: {
        AND: [
          { name: { contains: query, mode: "insensitive" } },
          { name: { not: "Своя пицца" } },
        ],
      },
      take: 5,
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("[PRODUCTS_SEARCH]", error);
    return NextResponse.json([], { status: 200 });
  }
}
