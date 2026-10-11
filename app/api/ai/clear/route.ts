import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // پاک کردن تمام گفتگوهای متعلق به کاربر از دیتابیس
    await prisma.conversation.deleteMany({
      where: { userId },
    });

    return NextResponse.json({ success: true, message: "Cleared successfully" }, { status: 200 });
  } catch (error) {
    console.error("Clear chat error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
  

}
