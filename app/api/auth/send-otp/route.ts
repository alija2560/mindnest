import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSmsOtp } from "@/lib/sms";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "شماره موبایل الزامی است" }, { status: 400 });
    }

    // 🛑 بررسی مسدود بودن کاربر قبل از ارسال کد
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser && existingUser.isActive === false) {
      return NextResponse.json(
        { 
          success: false, 
          error: "حساب کاربری شما توسط مدیریت مسدود شده است. امکان ورود به سامانه وجود ندارد." 
        }, 
        { status: 403 }
      );
    }

    // ۱. تولید کد ۴ رقمی
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // ۵ دقیقه انقضا

    // ۲. ذخیره یا بروزرسانی کد در دیتابیس
    await prisma.otpCode.upsert({
      where: { phone },
      update: { code, expiresAt },
      create: { phone, code, expiresAt },
    });

    // ۳. ارسال واقعی پیامک از طریق sms.ir به جای console.log
    const isSent = await sendSmsOtp(phone, code);

    if (!isSent) {
      return NextResponse.json(
        { success: false, error: "خطا در ارسال پیامک. لطفاً چند لحظه دیگر دوباره تلاش کنید." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "کد تایید با موفقیت ارسال شد" });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return NextResponse.json({ error: "خطا در سرور" }, { status: 500 });
  }
}