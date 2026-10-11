import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    // جستجوی پیام‌هایی که حاوی عبارت مورد نظر باشند و متعلق به کاربر باشند
    const messages = await prisma.message.findMany({
      where: {
        content: {
          contains: query,
          // توجه: اگر دیتابیس شما حساس به بزرگ/کوچک بودن حروف است، حالت insensitive کمک می‌کند
        },
        conversation: {
          userId: userId,
        },
      },
      include: {
        conversation: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20, // محدود کردن نتایج برای سرعت بیشتر
    });

    return NextResponse.json({ results: messages }, { status: 200 });
  } catch (error) {
    console.error("Search messages error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}