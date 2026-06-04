import { prisma } from "@/back/prisma/prisma-client";
import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID is required" },
        { status: 400 }
      );
    }

    const code = nanoid(8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const groupOrder = await prisma.groupOrder.create({
      data: {
        code,
        creatorId: Number(creatorId),
        expiresAt,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        participants: true,
      },
    });

    return NextResponse.json(groupOrder);
  } catch (error) {
    console.error("[GROUP_ORDER_CREATE]", error);
    return NextResponse.json(
      { error: "Failed to create group order" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const groupOrder = await prisma.groupOrder.findUnique({
      where: { code },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
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

    return NextResponse.json(groupOrder);
  } catch (error) {
    console.error("[GROUP_ORDER_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch group order" },
      { status: 500 }
    );
  }
}
