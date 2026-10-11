import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // گرفتن لیست تمام گفتگوهای کاربر به ترتیب جدیدترین
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ conversations }, { status: 200 });
  } catch (error) {
    console.error("Fetch Conversations Error:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست گفتگوها" }, { status: 500 });
  }
}