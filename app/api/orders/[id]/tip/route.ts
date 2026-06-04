import { prisma } from "@/back/prisma/prisma-client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = Number(params.id);
    const body = await req.json();
    const { amount, rating, comment } = body;

    if (!amount || amount < 0) {
      return NextResponse.json(
        { error: "Invalid tip amount" },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tip: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.tip) {
      return NextResponse.json(
        { error: "Tip already added" },
        { status: 400 }
      );
    }

    const tip = await prisma.courierTip.create({
      data: {
        orderId,
        amount: Number(amount),
        rating: rating ? Number(rating) : null,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json(tip);
  } catch (error) {
    console.error("[ORDER_TIP_POST]", error);
    return NextResponse.json(
      { error: "Failed to add tip" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = Number(params.id);

    const tip = await prisma.courierTip.findUnique({
      where: { orderId },
    });

    return NextResponse.json(tip);
  } catch (error) {
    console.error("[ORDER_TIP_GET]", error);
    return NextResponse.json(null, { status: 200 });
  }
}
