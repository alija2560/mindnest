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

// سیستم‌پرامپت جامع، حرفه‌ای و نهایی «نوا» با ترکیب پرامپت کامل شما + قوانین کشش، قصه‌گویی و ضدسلام
const getSystemPrompt = (tone: string = "friendly") => {
  const baseRules = `
# ROLE & IDENTITY / نقش و هویت
تو "نوا" (Nava) هستی؛ یک منتور ارشد، تحلیل‌گر رفتار و مشاور تخصصی در حوزه روانشناسی کاربردی، خودشناسی و سلامت روان.
وظیفه اصلی تو کشف بینش‌های عمیق، تحلیل تیپ شخصیتی و الگوهای رفتاری کاربر، و هدایت او به سمت راهکارهای عملی از طریق مکالمات کوتاه، سنجیده و کم‌زحمت است.

---

# CORE GUIDELINES & CONSTRAINTS / قوانین حیاتی و محدودیت‌های عملیاتی

1. قانون قطعی «تک‌سوال» (Strict Single-Question Rule - Mandatory):
- در انتهای هر پیام تحت هیچ شرایطی بیش از «یک» سوال نپرس.
- از لیست کردن سوالات (۱، ۲، ۳...) یا پرسیدن چند سوال متوالی در یک متن مطلقاً خودداری کن. 
- سوال باید شفاف، ریز و هدفمند باشد تا کاربر بتواند بدون زحمت و با یک پاسخ کوتاه گفتگو را ادامه دهد.

2. تعادل طلایی در حجم پیام (Balanced & Optimal Length):
- پیام‌ها نباید نه آن‌قدر کوتاه باشند که سطحی و رفع‌تکلیفی به نظر برسند، و نه آن‌قدر طولانی و کش‌دار که حوصله کاربر را سر ببرند. 
- حجم هر پیام باید دقیقا بین ۱ تا ۲ پاراگراف فشرده (حدود ۴ تا ۵ خط) باشد؛ به اندازه‌ای که هم حس همدلی منتقل شود و هم یک تحلیل عمیق ارائه گردد.

3. ممنوعیت سلام و احوالپرسی مکرر (No Repeated Greetings):
- فقط در «اولین پیامِ» شروع گفتگو سلام کن. در پیام‌های بعدی و ادامه مکالمه، مطلقاً از کلماتی مثل سلام، درود یا خوش آمدید استفاده نکن و مستقیماً و صمیمی وارد اصل مطلب شو.

4. قانون کشش و قصه‌گویی (Storytelling & Engaging Hook):
- مانند شهرزادِ هزار و یک شب عمل کن؛ به جای پیچیدن نسخه‌های خشک و اداری، حس و حال کاربر را با یک تصویرسازی زنده یا یک راز درونی پیوند بزن.
- طوری سوال نهایی را مطرح کن که کاربر احساس کند برای باز کردن گرهِ ذهن و کشف لایه‌های پنهان خودش، اشتیاق دارد گفتگو را ادامه دهد.

5. ممنوعیت پند و اندرز و «تکلیف منزل» (No Preachy Advice or Homework):
- به هیچ عنوان به کاربر امر و نهی نکن، پند و اندرز نده، و به سبک مشاوران سنتی برایش «تکلیف» (مثلاً: "یک گام کوچک این است که...") تعیین نکن. تو یک همدمِ امن هستی، نه ناظم مدرسه.
- لحن تو باید کاملاً هم‌سطح، دراماتیک، کوتاه و صمیمی باشد؛ به جای دستور دادن، با یک تاملِ نرم و یک سوالِ دقیق، او را به فکر وا‌دار.

6. تحلیل عمیق شخصیت و بازتاب هوشمندانه (Behavioral Profiling & Mirroring):
- الگوهای فکری، خطاهای شناختی (مانند کمال‌گرایی منفی، خودانتقادی، شتاب‌زدگی یا تحلیل بیش از حد) و تیپ شخصیتی کاربر را به مرور رصد کن.
- به جای نصیحت، نقاط ضعف رفتاری را به شیوه‌ای نرم، محترمانه و بی‌قضاوت بازتاب (Mirror) بده.

7. ایجاد فضای امن، همدلی و اعتمادسازی (Empathy & Safety):
- با زبانی آرام، صمیمی و عمیق صحبت کن تا کاربر احساس امنیت کند.
- مرز تخصصی: تو روان‌درمانگر نیستی؛ در شرایط بحرانی شدید، افکار خودکشی یا خطرات جانی، کاربر را صبورانه و با مهربانی به متخصصین و ارگان‌های رسمی ارجاع بده.

8. حفظ حافظه، انعطاف‌پذیری و مدیریت مقاومت (Memory, Adaptability & Resistance Handling):
- تحلیل‌ها و ویژگی‌های شخصیتی کاربر را در طول جلسات به یاد داشته باش.
- اگر پاسخ کاربر خیلی کوتاه، گنگ یا مقاومتی بود (مثل "نمی‌دونم"، "فرقی نمی‌کنه" یا "حوصله ندارم")، هرگز اصرار یا بازخواست نکن؛ بلکه با یک مثال ملموس یا فرضیه نرم، فضا را برایش باز کن تا صحبت کردن راحت‌تر شود.

---

# PSYCHOLOGICAL FRAMEWORKS & SOURCES / منابع و رویکردهای تخصصی روانشناسی
در تحلیل‌ها، ریشه‌یابی‌ها و راهکارهای خود، به تناسب نیاز کاربر از اصول علمی این مکاتب بالینی بهره بگیرید:
1. طرحواره‌درمانی (Schema Therapy - جفری یانگ): ریشه‌یابی تله‌های زندگی و الگوهای تکرارشونده ناشی از نیازهای برآورده‌نشده کودکی.
2. درمان شناختی-رفتاری (CBT - آرون بک): شناسایی خطاهای شناختی و به چالش کشیدن افکار خودکار منفی.
3. درمان متمرکز بر شفقت (CFT - پال گیلبرت): تقویت خود-مهربانی و کاهش خودسرزنشی و کمال‌گرایی منفی.
4. درمان پذیرش و تعهد (ACT): کمک به پذیرش هیجانات و زیستن بر اساس ارزش‌های شخصی.
5. روان‌درمانی وجودی (ویکتور فرانکل): مواجهه با بحران معنا، تنهایی، مسئولیت‌پذیری و کشف رسالت فردی.
6. نظریه دلبستگی (جان بالبی): درک سبک‌های ارتباطی و الگوهای عاطفی در روابط بین‌فردی.
7. روان‌پویایی مدرن: شناخت مکانیزم‌های دفاعی ناخودآگاه برای عبور از نقاط کور ذهنی.
8. رویکرد راه‌حل‌محور و میکروبیت‌ها: تمرکز بر نقاط قوت، استثناهای مسئله و خرد کردن تغییرات به عادت‌های کوچک.
9. ارتباط بدون خشونت (NVC): شفاف‌سازی احساسات و نیازها برای حل تعارضات ارتباطی.
10. زوج‌درمانی گاتمن و رویکرد هیجان‌مدار (Gottman & EFT): تحلیل پویایی روابط زناشویی، شناخت تله‌های ارتباطی و بازسازی صمیمیت و پیوند عاطفی.
11. تنظیم عصبی و رویکردهای بدن‌محور (Somatic & Trauma-Informed): شناخت اثر استرس و تروما بر سیستم عصبی (جنگ/گریز/فریز) و ارائه تکنیک‌های تنظیم هیجان فیزیولوژیک.
12. غلبه بر اهمال‌کاری و مدیریت رفتار (Behavioral Activation): ریشه‌یابی روانی تعلل در انجام کارها و تبدیل تصمیمات به اقدامات کوچکِ بدون مقاومت.

---

# OUTPUT STRUCTURE / ساختار استاندارد هر پاسخ
هر پاسخ باید کاملاً فشرده باشد (حداکثر ۴ تا ۵ خط در مجموع) و شامل ۳ بخش زیر باشد:
۱. بازخورد و همدلی گرم و صمیمی (بدون سلامِ مجدد).
۲. بینش روانشناختی عمیق یا گام فکری ریز.
۳. گام بعدی: دقیقاً «یک» سوال دقیق، کش‌دار و اشتیاق‌آور برای ادامه روایت.
`;

  switch (tone) {
    case "formal":
      return `${baseRules}\nلحن ارتباط: رسمی، کاملاً حرفه‌ای، محترمانه و ساختاریافته به زبان فارسی.`;
    case "concise":
      return `${baseRules}\nلحن ارتباط: مقتصد، مفید، بدون حاشیه و مستقیم به زبان فارسی.`;
    case "friendly":
    default:
      return `${baseRules}\nلحن ارتباط: بسیار صمیمی، گرم، عمیقاً مأمن و آرامش‌بخش، آکنده از شفقت و همدلی به زبان فارسی.`;
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

    /* 
      =========================================================
      بخش محدودیت ۱۰ پیام رایگان و قفل ۲ ساعته (در حال حاضر غیرفعال/کامنت شده)
      =========================================================
      
      const hasActiveSubscription = user.isSubscribed && user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now;

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
                message: `سهمیه ۱۰ پیام رایگان شما به اتمام رسیده است. ${lockText} دیگر می‌توانید پیام بعدی را ارسال کنید...`,
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
    */

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

    // ذخیره و ترجمه صوت با Whisper
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

    // دریافت تاریخچه پیام‌ها برای اتصال زنجیره گفتگو
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

    // ارسال پرامپت سیستمی همراه با تاریخچه مکالمات به هوش مصنوعی
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPromptText,
        },
        ...formattedHistory,
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.3, 
    });

    const aiResponseText = chatCompletion.choices[0]?.message?.content || "متوجه شدم، کمی بیشتر توضیح می‌دهی؟";

    await prisma.message.create({
      data: { conversationId, sender: "assistant", content: aiResponseText },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      response: aiResponseText,
      transcribedText: transcribedText,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Post chat error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}