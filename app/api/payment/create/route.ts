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

    // ۱. دریافت تنظیمات قیمت از دیتابیس
    let settings = await (prisma as any).systemSetting.findFirst();
    if (!settings) {
      settings = await (prisma as any).systemSetting.create({
        data: {
          initialGiftLimit: 50,
          dailyFreeLimit: 5,
          monthly1Price: 99000,
          monthly3Price: 249000,
          monthly6Price: 449000,
        },
      });
    }

    // تعیین قیمت و مدت‌زمان (بر اساس پکیج)
    let packagePrice = settings.monthly1Price || 99000;
    let daysToAdd = 30; // پیش‌فرض ۱ ماهه

    if (packageId === "3_month" || packageId === "monthly3") {
      packagePrice = settings.monthly3Price || 249000;
      daysToAdd = 90; // ۳ ماهه
    } else if (packageId === "6_month" || packageId === "monthly6") {
      packagePrice = settings.monthly6Price || 449000;
      daysToAdd = 180; // ۶ ماهه
    }

    // ۲. ثبت تراکنش
    await (prisma as any).transaction.create({
      data: {
        userId,
        amount: packagePrice,
        credits: 0,
        status: "SUCCESS",
      },
    });

    // ۳. محاسبه تاریخ انقضای اشتراک
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    
    let baseDate = now;
    if (currentUser && currentUser.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > now) {
      baseDate = new Date(currentUser.subscriptionExpiresAt);
    }

    const expirationDate = new Date(baseDate);
    expirationDate.setDate(expirationDate.getDate() + daysToAdd);

    // ۴. فعال‌سازی اشتراک برای کاربر
    await prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subscriptionExpiresAt: expirationDate,
        lockUntil: null,
      },
    });

    // ۵. هدایت به صفحه موفقیت پرداخت
    return NextResponse.json({
      success: true,
      url: "/credit/success",
    });

  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}