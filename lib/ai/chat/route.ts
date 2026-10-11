import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import { validateAndTouchSession } from "@/lib/auth"; // تابع بررسی سشن و عدم فعالیت

// استفاده از کلید API
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6IBCri8PIluF3nqfUX7ssdmNgRBgL5rhSGBNQ" });

// دریافت پیام‌های یک گفتگوی خاص با کلیک روی سایدبار
export async function GET(req: Request) {
  try {
    // ۱. بررسی اعتبار سشن و انقضا به دلیل عدم فعالیت
    const authCheck = await validateAndTouchSession();
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    
    const user = authCheck.user;
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ conversationId: null, messages: [] });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { 
        id: conversationId, 
        userId: userId 
      },
      include: { 
        messages: { 
          orderBy: { createdAt: "asc" } 
        } 
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages,
    }, { status: 200 });

  } catch (error) {
    console.error("Get chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ثبت پیام جدید و پاسخ هوش مصنوعی
export async function POST(req: Request) {
  try {
    // ۱. بررسی اعتبار سشن و انقضا به دلیل عدم فعالیت
    const authCheck = await validateAndTouchSession();
    if ("error" in authCheck) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    
    const user = authCheck.user;
    const userId = user.id;

    const body = await req.json();
    const { message } = body;
    let { conversationId } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!conversationId) {
      const generatedTitle = message.length > 20 ? message.substring(0, 20) + "..." : message;
      
      const newConv = await prisma.conversation.create({
        data: {
          userId,
          title: generatedTitle,
        },
      });
      conversationId = newConv.id;
    }

    await prisma.message.create({
      data: {
        conversationId,
        sender: "user",
        content: message,
      },
    });

    const previousMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const formattedHistory = previousMessages.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

    // دریافت پاسخ از گوگل جن‌آی
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedHistory,
      config: {
        systemInstruction: "تو «نوا» هستی؛ یک همراه مهربان، همدل و گوش شنوای امن برای کاربر. با لحنی آرامش‌بخش، صمیمی و دوستانه به زبان فارسی پاسخ بده.",
      },
    });

    const aiResponseText = response.text || "متوجه شدم، کمی بیشتر توضیح می‌دهی؟";

    await prisma.message.create({
      data: {
        conversationId,
        sender: "assistant",
        content: aiResponseText,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      response: aiResponseText,
    }, { status: 200 });

  } catch (error) {
    console.error("Post chat error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}