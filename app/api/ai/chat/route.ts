import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Groq } from "groq-sdk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// 🚀 تنظیم Base URL به پروکسی Vercel برای عبور از تحریم و خطای ۴۰۳
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy",
  baseURL: "https://nava-vercel-proxy.vercel.app",
});

// سیستم‌پرامپت جامع و حرفه‌ای «نوا» با لحاظ کردن لحن‌های مختلف و قوانین سخت‌گیرانه تعاملی
const getSystemPrompt = (tone: string = "friendly") => {
  const baseRules = `
[CRITICAL SYSTEM RULES - NON-NEGOTIABLE]
تو "نوا" (Nava) هستی؛ یک منتور ارشد، تحلیل‌گر رفتار و مشاور تخصصی در حوزه روانشناسی کاربردی، خودشناسی و سلامت روان. هدف تو یک گفتگوی طولانی، گام‌به‌گام و تعاملی است، نه دادن پاسخ‌های طولانی یا کلی‌گویی در یک پیام.

قوانین سخت‌گیرانه پاسخ‌دهی:
1. قانون قطعی «تک‌سوال» (Single Question Rule): در انتهای هر پیام تحت هیچ شرایطی بیش از «یک» سوال نپرس. از لیست کردن سوالات یا شماره‌گذاری خودداری کن تا پاسخ دادن برای کاربر ساده باشد.
2. پیشروی گام‌به‌گام (Micro-Interactions): از متن‌های طولانی و کلی‌گویی پرهیز کن. کل مسئله را یک‌جا حل نکن؛ در هر پیام فقط روی ۱ نکته یا ۱ گام کوچک تمرکز کن. حجم کل پیام حداکثر ۴ تا ۵ خط باشد.
3. تحلیل شخصیتی و بازتاب: الگوهای فکری، خطاهای شناختی و تیپ شخصیتی کاربر را به مرور رصد کرده و محترمانه بازتاب بده.
4. سیاست داده‌ها: در صورت لزوم به کاربر یادآوری کن که گفتگوها پس از ۴۸ ساعت به صورت خودکار پاک می‌شوند و می‌تواند در صورت نیاز خروجی بگیرد.

ساختار استاندارد پاسخ (حداکثر ۳ بخش کوتاه):
1. بازخورد و همدلی کوتاه (۱ تا ۲ جمله)
2. بینش روانشناسی یا راهکار ریز (۱ تا ۲ جمله)
3. دقیقاً «یک» سوال دقیق و هدفمند برای گام بعدی.
`;

  switch (tone) {
    case "formal":
      return `${baseRules}\nلحن کاربر: رسمی، دقیق، حرفه‌ای و ساختاریافته به زبان فارسی.`;
    case "concise":
      return `${baseRules}\nلحن کاربر: بسیار کوتاه، مقتصد، بدون حاشیه و مستقیم به زبان فارسی.`;
    case "friendly":
    default:
      return `${baseRules}\nلحن کاربر: بسیار صمیمی، همدلانه، گرم، آرامش‌بخش و پر از آرامش به زبان فارسی.`;
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

    // ۲. بررسی سهمیه پیام‌های رایگان
    if (!hasActiveSubscription) {
      const FREE_LIMIT = 10;

      if (user.messageCount >= FREE_LIMIT) {
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
              message: `سهمیه ۱۰ پیام رایگان شما به اتمام رسیده است. ${lockText} دیگر می‌توانید پیام بعدی را ارسال کنید، یا برای ادامه گفتگو به صورت نامحدود، یکی از بسته‌های اشتراک را تهیه کنید.`,
              lockUntil: user.lockUntil
            }, 
            { status: 403 }
          );
        } else {
          const nextLockTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);
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

    // ۳. ذخیره و ترجمه صوت با Whisper
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
        const transcription = await groq.audio.transcriptions.create({
          file: targetAudio,
          model: "whisper-large-v3",
          language: "fa",
        });

        transcribedText = transcription.text ? transcription.text.trim() : "";
      } catch (transError: any) {
        console.error("❌ Whisper transcription error:", transError?.message || transError);
      }
    }

    let userMessageContent = message;
    if (targetAudio) {
      if (transcribedText) {
        userMessageContent = message ? `${message}\n\n💬 ${transcribedText}` : `💬 ${transcribedText}`;
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

    // ذخیره پیام کاربر
    await prisma.message.create({
      data: { 
        conversationId, 
        sender: "user", 
        content: userMessageContent,
        audioUrl: audioUrl,
      },
    });

    // دریافت تاریخچه (۱۰ پیام آخر برای حفظ زمینه و رعایت نرخ توکن)
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
      model: "openai/gpt-oss-120b",
      temperature: 0.3, // 👈 کاهش دمانس برای تبعیت دقیق‌تر از قوانین تک‌سوال و کوتاه‌گویی
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || "متوجه شدم، کمی بیشتر توضیح می‌دهی؟";

    await prisma.message.create({
      data: { conversationId, sender: "assistant", content: aiResponseText },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

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