import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
    }

    // ۱. بررسی وجود کاربر و مسدود بودن توسط مدیریت
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser && existingUser.isActive === false) {
      return NextResponse.json(
        { 
          success: false, 
          error: "حساب کاربری شما توسط مدیریت مسدود شده است. دسترسی شما به این سامانه مقدور نمی‌باشد." 
        }, 
        { status: 403 }
      );
    }

    // 🛑 ۱.۵. بررسی قفل موقت ۵ دقیقه‌ای به دلیل تلاش‌های ناموفق مکرر
    if (existingUser && existingUser.lockUntil && existingUser.lockUntil > new Date()) {
      const remainingSeconds = Math.ceil((existingUser.lockUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: "به دلیل ۳ بار تلاش ناموفق، حساب شما موقتاً قفل شده است.", 
          remainingTime: remainingSeconds 
        }, 
        { status: 429 }
      );
    }

    // ۲. پیدا کردن کد در دیتابیس
    const otpRecord = await prisma.otpCode.findUnique({
      where: { phone },
    });

    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < new Date()) {
      
      // مدیریت تلاش‌های ناموفق چه کاربر قبلاً وجود داشته باشد چه نداشته باشد
      const currentAttempts = existingUser ? (existingUser.failedAttempts || 0) : 0;
      const newAttempts = currentAttempts + 1;

      if (newAttempts >= 3) {
        const lockUntilTime = new Date(Date.now() + 5 * 60 * 1000); // قفل برای ۵ دقیقه آینده
        
        await prisma.user.upsert({
          where: { phone },
          update: { 
            failedAttempts: 0, // ریست کردن برای شمارش دوره بعدی پس از اتمام قفل
            lockUntil: lockUntilTime 
          },
          create: { 
            phone, 
            failedAttempts: 0, 
            lockUntil: lockUntilTime 
          },
        });

        return NextResponse.json(
          { 
            success: false, 
            error: "۳ بار کد اشتباه وارد شد. حساب شما به مدت ۵ دقیقه قفل شد.", 
            remainingTime: 300 
          }, 
          { status: 429 }
        );
      } else {
        // ثبت یا آپدیت تعداد خطاهای جدید با استفاده از upsert
        await prisma.user.upsert({
          where: { phone },
          update: { failedAttempts: newAttempts },
          create: { phone, failedAttempts: newAttempts },
        });
      }

      return NextResponse.json({ error: "کد تایید نامعتبر یا منقضی شده است" }, { status: 400 });
    }

    // ۳. پاک کردن کد پس از استفاده موفق
    await prisma.otpCode.delete({ where: { phone } });

    // ۴. پیدا کردن یا ساختن کاربر در صورت عدم وجود
    let user = existingUser;
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    // بررسی دوباره وضعیت فعال بودن کاربر
    if (user.isActive === false) {
      return NextResponse.json(
        { 
          success: false, 
          error: "حساب کاربری شما توسط مدیریت مسدود شده است. دسترسی شما به این سامانه مقدور نمی‌باشد." 
        }, 
        { status: 403 }
      );
    }

    // 🟢 ۵. ورود موفق: صفر کردن تعداد خطاهای قبلی و برداشتن قفل
    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts: 0, lockUntil: null },
    });

    // ۶. ایجاد یک توکن امن برای کاربر
    const token = crypto.randomBytes(32).toString("hex");

    // ۷. ساخت کوکی احراز هویت با انقضای ۱۰ دقیقه
    const cookieStore = await cookies();
    cookieStore.set({
      name: "nava_session",
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 60, // ۱۰ دقیقه
    });

    return NextResponse.json({ 
      success: true, 
      message: "ورود موفقیت‌آمیز بود", 
      userId: user.id,
      token: token 
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json({ error: "خطا در سرور" }, { status: 500 });
  }
}