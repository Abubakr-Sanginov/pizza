export const dynamic = "force-dynamic";

import { prisma } from "@/back/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ingredients = await prisma.ingredient.findMany();
    return NextResponse.json(ingredients);
  } catch (error) {
    console.error("[INGREDIENTS_GET]", error);
    return NextResponse.json([], { status: 200 });
  }
}
