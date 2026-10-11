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

    const { packageId } = await req.json();

    // ۱. دریافت تنظیمات پویا از دیتابیس برای خواندن تعداد پیام و قیمت پکیج‌ها
    let settings = await (prisma as any).systemSetting.findFirst();
    if (!settings) {
      settings = await (prisma as any).systemSetting.create({
        data: {
          initialGiftLimit: 50,
          dailyFreeLimit: 5,
          monthly1Credits: 200,
          monthly1Price: 99000,
          monthly3Credits: 700,
          monthly3Price: 249000,
          monthly6Credits: 1600,
          monthly6Price: 449000,
        },
      });
    }

    // تعیین تعداد پیام، مبلغ و مدت‌زمان انقضا بر اساس پکیج انتخابی
    let creditToAdd = settings.monthly1Credits;
    let packagePrice = settings.monthly1Price;
    let daysToAdd = 30; // پیش‌فرض ۱ ماهه

    if (packageId === "3_month") {
      creditToAdd = settings.monthly3Credits;
      packagePrice = settings.monthly3Price;
      daysToAdd = 90;
    } else if (packageId === "6_month") {
      creditToAdd = settings.monthly6Credits;
      packagePrice = settings.monthly6Price;
      daysToAdd = 180;
    }

    // ۲. ثبت رکورد تراکنش با وضعیت SUCCESS (یا PENDING در حالت اتصال به درگاه واقعی)
    await (prisma as any).transaction.create({
      data: {
        userId,
        amount: packagePrice,
        credits: creditToAdd,
        status: "SUCCESS", // در صورت اتصال به درگاه واقعی می‌توانید ابتدا PENDING بگذارید
      },
    });

    // ۳. دریافت اطلاعات کاربر و به‌روزرسانی اعتبار و تاریخ انقضا
    const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    const currentCredit = user?.credit || 0;
    
    // محاسبه تاریخ انقضا بر اساس تعداد روزهای پکیج
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysToAdd);

    await (prisma as any).user.update({
      where: { id: userId },
      data: {
        credit: currentCredit + creditToAdd,
        creditExpiresAt: expirationDate,
      },
    });

    // بازگرداندن آدرس هدایت به صفحه موفقیت
    return NextResponse.json({
      success: true,
      url: "/chat?payment=success",
    });

  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}