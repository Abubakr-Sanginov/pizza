import { prisma } from "@/back/prisma/prisma-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string; participantId: string } }
) {
  try {
    const { code, participantId } = params;
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "Items array is required" },
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

    if (groupOrder.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Group order is not active" },
        { status: 400 }
      );
    }

    const participant = await prisma.groupOrderParticipant.findUnique({
      where: { id: Number(participantId) },
    });

    if (!participant || participant.groupOrderId !== groupOrder.id) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, item: any) =>
        sum + (item.productItem?.price || 0) * (item.quantity || 1),
      0
    );

    const updatedParticipant = await prisma.groupOrderParticipant.update({
      where: { id: Number(participantId) },
      data: {
        items: JSON.stringify(items),
        totalAmount,
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

    const allParticipants = await prisma.groupOrderParticipant.findMany({
      where: { groupOrderId: groupOrder.id },
    });

    const groupTotalAmount = allParticipants.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );

    await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: { totalAmount: groupTotalAmount },
    });

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("[GROUP_ORDER_ADD_ITEMS]", error);
    return NextResponse.json(
      { error: "Failed to add items" },
      { status: 500 }
    );
  }
}
