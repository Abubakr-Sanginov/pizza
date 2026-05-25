import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { prisma } from "@/back/prisma/prisma-client";
import { authOptions } from "@/shared/constants/auth-options";

export async function POST(req: NextRequest) {
  try {
    const { token, platform, userId: bodyUserId } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const headerUserId = req.headers.get("x-user-id");
    const resolvedUserId =
      (session?.user?.id ? Number(session.user.id) : null) ??
      (headerUserId ? Number(headerUserId) : null) ??
      (bodyUserId ? Number(bodyUserId) : null);

    const userId = Number.isFinite(resolvedUserId as number)
      ? (resolvedUserId as number)
      : null;

    try {
      const pushToken = await prisma.pushToken.upsert({
        where: { token },
        update: { userId, platform },
        create: { token, platform, userId },
      });
      return NextResponse.json(pushToken);
    } catch (dbError: any) {
      // Table may not exist in production yet — return 200 to avoid client errors
      if (
        dbError?.code === "P2021" ||
        dbError?.message?.includes("does not exist")
      ) {
        console.warn("[PUSH_TOKEN_POST] PushToken table not found, skipping");
        return NextResponse.json({ ok: true });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("[PUSH_TOKEN_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token)
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    await prisma.pushToken.delete({ where: { token } }).catch(() => {});
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
