import { prisma } from "@/back/prisma/prisma-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await req.json();
    const { userId, guestName } = body;

    if (!userId && !guestName) {
      return NextResponse.json(
        { error: "User ID or guest name is required" },
        { status: 400 }
      );
    }

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { code },
    });

    if (!groupOrder) {
      return NextResponse.json(
        { error: "Group order not found" },
        { status: 404 }
      );
    }

    if (new Date() > groupOrder.expiresAt) {
      return NextResponse.json(
        { error: "Group order expired" },
        { status: 410 }
      );
    }

    if (groupOrder.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Group order is not active" },
        { status: 400 }
      );
    }

    const existingParticipant = userId
      ? await prisma.groupOrderParticipant.findUnique({
          where: {
            groupOrderId_userId: {
              groupOrderId: groupOrder.id,
              userId: Number(userId),
            },
          },
        })
      : null;

    if (existingParticipant) {
      return NextResponse.json(existingParticipant);
    }

    const participant = await prisma.groupOrderParticipant.create({
      data: {
        groupOrderId: groupOrder.id,
        userId: userId ? Number(userId) : null,
        guestName: guestName || null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(participant);
  } catch (error) {
    console.error("[GROUP_ORDER_JOIN]", error);
    return NextResponse.json(
      { error: "Failed to join group order" },
      { status: 500 }
    );
  }
}
