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

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت." }, { status: 401 });
    }

    const userId = sessionCookie.value;

    // ۱. دریافت رکوردهای پایش حال کاربر
    const moods = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }).catch(() => []);

    // ۲. پیدا کردن مکالمات این کاربر و استخراج پیام‌ها از طریق جدول Conversation
    let recentChats: any[] = [];
    try {
      const userConversations = await prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 5,
          }
        },
        orderBy: { updatedAt: "desc" },
        take: 3,
      });

      // جمع‌آوری و مرتب‌سازی تمام پیام‌های مکالمات کاربر
      for (const conv of userConversations) {
        if (conv.messages && conv.messages.length > 0) {
          for (const msg of conv.messages) {
            recentChats.push({
              content: msg.content,
              role: msg.sender, // در مدل شما sender مقدارهایی مثل user یا assistant دارد
              createdAt: msg.createdAt
            });
          }
        }
      }

      // مرتب‌سازی بر اساس جدیدترین زمان
      recentChats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (e) {
      console.error("Error fetching conversations/messages:", e);
    }

    return NextResponse.json({ 
      success: true, 
      moods, 
      recentChats: recentChats.slice(0, 10) 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ [Mood API GET Error]:", error);
    return NextResponse.json({ success: false, message: "خطای سرور در بازیابی اطلاعات." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = 
      cookieStore.get("nava_session") || 
      cookieStore.get("token") || 
      cookieStore.get("auth_token") || 
      cookieStore.get("session") ||
      cookieStore.get("next-auth.session-token");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت." }, { status: 401 });
    }

    const userId = sessionCookie.value;
    const body = await req.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json({ success: false, message: "داده‌های نامعتبر." }, { status: 400 });
    }

    const { mood, energy, stress, sleep, note } = body;
    const fields = [mood, energy, stress, sleep];
    
    if (fields.some((val) => typeof val !== "number" || !Number.isInteger(val) || val < 1 || val > 5)) {
      return NextResponse.json({ success: false, message: "مقادیر باید بین ۱ تا ۵ باشند." }, { status: 400 });
    }

    const sanitizedNote = typeof note === "string" ? note.trim().slice(0, 500) : "";

    const newMood = await prisma.moodEntry.create({
      data: {
        userId,
        mood,
        energy,
        stress,
        sleep,
        note: sanitizedNote,
      },
    });

    return NextResponse.json({ success: true, message: "با موفقیت ثبت شد.", newMood }, { status: 201 });

  } catch (error: any) {
    console.error("❌ [Mood API POST Error]:", error);
    return NextResponse.json({ success: false, message: "خطا در ثبت اطلاعات." }, { status: 500 });
  }
}