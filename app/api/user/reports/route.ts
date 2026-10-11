import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = 
      cookieStore.get("nava_session") || 
      cookieStore.get("token") || 
      cookieStore.get("auth_token") || 
      cookieStore.get("session") ||
      cookieStore.get("next-auth.session-token");

    if (!sessionCookie) {
      return NextResponse.json({ 
        success: false, 
        message: "کوکی احراز هویت یافت نشد." 
      }, { status: 401 });
    }

    const tokenValue = sessionCookie.value;
    let userId = tokenValue;

    // اصلاح شد: حذف فیلد منسوخ‌شده credit و اضافه کردن فیلدهای اشتراک زمانی جدید
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        phone: true, 
        email: true, 
        messageCount: true, 
        lastMessageDate: true,
        isSubscribed: true,
        subscriptionExpiresAt: true,
        lockUntil: true
      }
    }).catch(() => null);

    if (!user) {
      const activeSession = await (prisma as any).session?.findFirst({
        where: { 
          OR: [
            { token: tokenValue },
            { id: tokenValue }
          ]
        },
        include: { user: true }
      }).catch(() => null);

      if (activeSession && activeSession.user) {
        user = activeSession.user;
        userId = user.id;
      }
    }

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "کاربر مرتبط با این سشن در دیتابیس یافت نشد." 
      }, { status: 401 });
    }

    // دریافت تراکنش‌ها
    const transactions = await prisma.transaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    // دریافت مکالمات و پیام‌های کاربر به همراه جزئیات کامل
    const conversations = await prisma.conversation.findMany({
      where: { userId: userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { updatedAt: "desc" }
    }).catch(() => []);

    // تخته‌کردن (Flatten) پیام‌ها برای نمایش یکجا در جدول تاریخچه پیام‌ها
    const allMessages = conversations.flatMap(conv => 
      conv.messages.map(msg => ({
        id: msg.id,
        conversationId: conv.id,
        conversationTitle: conv.title || "گفتگوی بدون عنوان",
        sender: msg.sender,
        content: msg.content,
        riskLevel: (msg as any).riskLevel,
        createdAt: msg.createdAt,
      }))
    );

    // مرتب‌سازی کل پیام‌ها بر اساس جدیدترین
    allMessages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(new Date(a.createdAt)).getTime());

    return NextResponse.json({
      success: true,
      data: {
        user,
        transactions: {
          items: transactions,
          total: transactions.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
        messages: {
          items: allMessages,
          total: allMessages.length,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    });

  } catch (error: any) {
    console.error("❌ [Reports API Error]:", error);
    return NextResponse.json({ success: false, message: `خطای سرور: ${error.message}` }, { status: 500 });
  }
}