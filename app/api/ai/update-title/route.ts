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

    const { conversationId, title } = await req.json();

    if (!conversationId || !title) {
      return NextResponse.json(
        { error: "شناسه گفتگو و عنوان جدید الزامی است." },
        { status: 400 }
      );
    }

    // بررسی اینکه گفتگو متعلق به همین کاربر باشد
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // آپدیت کردن عنوان گفتگو در دیتابیس
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() },
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Update title error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}