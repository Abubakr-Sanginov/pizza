export const dynamic = "force-dynamic";

import { prisma } from "@/back/prisma/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stories = await prisma.story.findMany({
      include: { items: true },
    });
    return NextResponse.json(stories);
  } catch (error) {
    console.error("[STORIES_GET]", error);
    return NextResponse.json([], { status: 200 });
  }
}
