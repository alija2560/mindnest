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

    // 🛑 ۱. اول بررسی کنیم که آیا کاربری با این شماره وجود دارد و مسدود است یا خیر
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

    // ۲. پیدا کردن کد در دیتابیس
    const otpRecord = await prisma.otpCode.findUnique({
      where: { phone },
    });

    if (!otpRecord || otpRecord.code !== otp || otpRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "کد تایید نامعتبر یا منقضی شده است" }, { status: 400 });
    }

    // ۳. پاک کردن کد پس از استفاده موفق
    await prisma.otpCode.delete({ where: { phone } });

    // ۴. پیدا کردن یا ساختن کاربر (ثبت‌نام خودکار)
    let user = existingUser;
    if (!user) {
      user = await prisma.user.create({ data: { phone } });
    }

    // بررسی دوباره برای اطمینان خاطر
    if (user.isActive === false) {
      return NextResponse.json(
        { 
          success: false, 
          error: "حساب کاربری شما توسط مدیریت مسدود شده است. دسترسی شما به این سامانه مقدور نمی‌باشد." 
        }, 
        { status: 403 }
      );
    }

    // ۵. ایجاد یک توکن امن برای کاربر
    const token = crypto.randomBytes(32).toString("hex");


    // ۶. ساخت کوکی احراز هویت (با تنظیمات سازگار با لوکال‌هاست و محیط تولید)
    const cookieStore = await cookies();
    cookieStore.set({
      name: "nava_session",
      value: user.id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // روی حالت لوکال false می‌ماند تا کوکی ذخیره شود
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // ۷ روز
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