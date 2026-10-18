import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Groq } from "groq-sdk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 🚀 تنظیم Base URL به پروکسی Vercel برای عبور از تحریم و خطای ۴۰۳
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy",
  baseURL: "https://nava-vercel-proxy.vercel.app", // آدرس پروکسی Vercel شما
});

const getSystemPrompt = (tone: string = "friendly") => {
  switch (tone) {
    case "formal":
      return "تو «نوا» هستی؛ یک دستیار هوشمند با لحنی رسمی، دقیق، حرفه‌ای و ساختاریافته به زبان فارسی پاسخ بده.";
    case "concise":
      return "تو «نوا» هستی؛ یک دستیار هوشمند با لحنی بسیار کوتاه، مقتصد، بدون حاشیه و مستقیم به زبان فارسی پاسخ بده.";
    case "friendly":
    default:
      return "تو «نوا» هستی؛ پناهگاه امن ذهن، همدم و گوش شنوای کاربر با لحنی بسیار صمیمی، همدلانه، گرم و پر از آرامش به زبان فارسی پاسخ بده.";
  }
};

// دریافت پیام‌های یک گفتگو
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json({ conversationId: null, messages: [] });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
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

  } catch (error: any) {
    console.error("Get chat error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// ثبت پیام جدید
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    // ۱. بررسی اشتراک زمانی فعال (نامحدود در تعداد پیام)
    const hasActiveSubscription = user.isSubscribed && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;

    // ۲. اگر اشتراک فعال نداشت، بررسی سهمیه پیام‌های رایگان و قفل موقت
    if (!hasActiveSubscription) {
      const FREE_LIMIT = 10;

      if (user.messageCount >= FREE_LIMIT) {
        // الف) بررسی اینکه آیا کاربر در حال حاضر در بازه قفل موقت قرار دارد یا خیر
        if (user.lockUntil && new Date(user.lockUntil) > now) {
          const remainingTimeMs = new Date(user.lockUntil).getTime() - now.getTime();
          const remainingMinutes = Math.ceil(remainingTimeMs / (1000 * 60));
          const hours = Math.floor(remainingMinutes / 60);
          const minutes = remainingMinutes % 60;
          
          let lockText = hours > 0 ? `${hours} ساعت و ${minutes} دقیقه` : `${minutes} دقیقه`;

          return NextResponse.json(
            { 
              error: "TEMPORARY_LOCKED", 
              code: "TEMPORARY_LOCKED",
              message: `سهمیه ۱۰ پیام رایگان شما به اتمام رسیده است. ${lockText} دیگر می‌توانید پیام بعدی را ارسال کنید، یا برای ادامه گفتگو به صورت نامحدود و بدون معطلی، یکی از بسته‌های اشتراک را تهیه کنید.`,
              lockUntil: user.lockUntil
            }, 
            { status: 403 }
          );
        } else {
          // ب) اگر زمان قفل تمام شده باشد، اجازه ارسال ۱ پیام داده می‌شود 
          const nextLockTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // قفل ۲ ساعته
          await prisma.user.update({
            where: { id: userId },
            data: { lockUntil: nextLockTime }
          });
        }
      }
    }

    const formData = await req.formData();
    const message = formData.get("message") as string || "";
    let conversationId = formData.get("conversationId") as string | null;
    const file = formData.get("file") as File | null;
    const audioFile = formData.get("audio") as File | null;
    const userTone = (formData.get("tone") as string) || "friendly";

    const targetAudio = audioFile || (file && file.type.includes("audio") ? file : null);

    if (!message && !file && !audioFile) {
      return NextResponse.json({ error: "Message or file is required" }, { status: 400 });
    }

    let audioUrl = null;
    let transcribedText = "";

    // ۳. ذخیره فایل صوتی روی سرور و تبدیل با مدل Whisper از طریق پروکسی
    if (targetAudio && targetAudio.size > 0) {
      const bytes = await targetAudio.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);
        audioUrl = `/uploads/${filename}`;
      } catch (err) {
        console.error("Error saving audio file:", err);
      }

      try {
        console.log("🎙️ Sending audio to Whisper via Proxy...");
        const transcription = await groq.audio.transcriptions.create({
          file: targetAudio,
          model: "whisper-large-v3",
          language: "fa",
        });

        transcribedText = transcription.text ? transcription.text.trim() : "";
        console.log("✨ Transcribed Text Result:", transcribedText);
      } catch (transError: any) {
        console.error("❌ Whisper transcription error:", transError?.message || transError);
      }
    }

    // ۴. ترکیب متن صوتی به عنوان متنِ اصلی در زیر صوت
    let userMessageContent = message;
    if (targetAudio) {
      if (transcribedText) {
        userMessageContent = message 
          ? `${message}\n\n💬 ${transcribedText}` 
          : `💬 ${transcribedText}`;
      } else {
        userMessageContent = message || "🎤 [پیام صوتی]";
      }
    } else if (file) {
      userMessageContent = message || `[فایل پیوست: ${file.name}]`;
    }

    if (!conversationId) {
      const titleSource = transcribedText || message || "گفتگوی جدید";
      const generatedTitle = titleSource.length > 20 ? titleSource.substring(0, 20) + "..." : titleSource;
      
      const newConv = await prisma.conversation.create({
        data: { userId, title: generatedTitle },
      });
      conversationId = newConv.id;
    }

    // ۵. ذخیره پیام کاربر در دیتابیس
    await prisma.message.create({
      data: { 
        conversationId, 
        sender: "user", 
        content: userMessageContent,
        audioUrl: audioUrl,
      },
    });

    // دریافت تاریخچه و محدود کردن آن به ۱۰ پیام آخر جهت جلوگیری از خطای کمبود توکن (Rate Limit)
    const allMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const previousMessages = allMessages.slice(-10);

    const formattedHistory = previousMessages.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    const systemPromptText = getSystemPrompt(userTone);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPromptText,
        },
        ...formattedHistory,
      ],
      mmodel: "llama-3.1-70b-versatile",
      temperature: 0.7,
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || "متوجه شدم، کمی بیشتر توضیح می‌دهی؟";

    await prisma.message.create({
      data: { conversationId, sender: "assistant", content: aiResponseText },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // ۶. افزایش شمارنده پیام‌های کاربر (فقط در صورت نداشتن اشتراک فعال)
    let updatedMessageCount = user.messageCount;
    if (!hasActiveSubscription) {
      updatedMessageCount += 1;
      await prisma.user.update({
        where: { id: userId },
        data: {
          messageCount: updatedMessageCount,
          lastMessageDate: new Date(),
        },
      });
    }

    const remainingFree = hasActiveSubscription ? 999 : Math.max(0, 10 - updatedMessageCount);

    return NextResponse.json({
      conversationId,
      response: aiResponseText,
      remainingFree: remainingFree,
      isSubscribed: hasActiveSubscription,
      transcribedText: transcribedText,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Post chat error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}