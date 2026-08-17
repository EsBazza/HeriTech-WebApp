import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/messages?userId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, workshopName: true, stationName: true },
        },
        receiver: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, workshopName: true, stationName: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: any) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/messages
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content, contextType, contextId, isSystem = false } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { success: false, error: "senderId, receiverId, and content are required" },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        contextType,
        contextId,
        isSystem,
      },
      include: {
        sender: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, workshopName: true, stationName: true },
        },
        receiver: {
          select: { id: true, fullName: true, role: true, avatarUrl: true, workshopName: true, stationName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error: any) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
