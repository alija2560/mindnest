import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "nava-secret-key-2026";

export async function GET(req: Request) {
  try {
    // 1. دریافت تنظیمات پیش‌فرض سیستم از دیتابیس
    const globalSettings = await prisma.systemSetting.findFirst();
    let monthly1Price = globalSettings?.monthly1Price ?? 99000;
    let monthly3Price = globalSettings?.monthly3Price ?? 249000;
    let monthly6Price = globalSettings?.monthly6Price ?? 449000;

    // 2. استخراج مستقیم کوکی سشن از درخواست
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("nava_session")?.value;

    if (sessionToken) {
      let userId: string | null = null;
      try {
        const decoded: any = jwt.verify(sessionToken, JWT_SECRET);
        userId = decoded.userId || decoded.id || decoded.sub;
      } catch (e) {
        // اگر توکن به شکل JWT نبود، شاید خودِ رشته‌ی شناسه/ایمیل باشد
        userId = sessionToken;
      }

      if (userId) {
        // 3. پیدا کردن کاربر در دیتابیس برای خواندن قیمت‌های سفارشی اختصاصی‌اش
        const dbUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { email: userId },
              { phone: userId }
            ]
          }
        });

        if (dbUser) {
          // 4. اگر ادمین برای این کاربر قیمت سفارشی گذاشته بود، جایگزین کن
          if (dbUser.customMonthly1Price !== null && dbUser.customMonthly1Price !== undefined) {
            monthly1Price = Number(dbUser.customMonthly1Price);
          }
          if (dbUser.customMonthly3Price !== null && dbUser.customMonthly3Price !== undefined) {
            monthly3Price = Number(dbUser.customMonthly3Price);
          }
          if (dbUser.customMonthly6Price !== null && dbUser.customMonthly6Price !== undefined) {
            monthly6Price = Number(dbUser.customMonthly6Price);
          }
        }
      }
    }

    return NextResponse.json({
      monthly1Price,
      monthly3Price,
      monthly6Price,
    }, { headers: { "Cache-Control": "no-store" } });

  } catch (error: any) {
    console.error("Error fetching user package pricing:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}