import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // بررسی اینکه گفتگو متعلق به همین کاربر باشد و سپس حذف پیام‌ها و خود گفتگو
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // حذف پیام‌های این گفتگو
    await prisma.message.deleteMany({
      where: { conversationId },
    });

    // حذف خود گفتگو
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}