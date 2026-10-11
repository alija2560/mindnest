import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("nava_session");
    const userId = sessionCookie?.value;

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        message: "کوکی احراز هویت (nava_session) یافت نشد. لطفاً وارد شوید." 
      }, { status: 401 });
    }

    // ۱. یافتن کاربر بر اساس کوکی فعلی
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, phone: true, isAdmin: true, isActive: true },
    }).catch(() => null);

    if (!dbUser) {
      return NextResponse.json({ 
        success: false, 
        message: "کاربر یافت نشد." 
      }, { status: 401 });
    }

    if (dbUser.isActive === false) {
      return NextResponse.json({ 
        success: false, 
        message: "حساب کاربری شما مسدود شده است." 
      }, { status: 403 });
    }

    // ۲. بررسی دقیق سطح دسترسی: اگر ادمین نبود، اجازه ورود ندهیم!
    if (!dbUser.isAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: "شما اجازه دسترسی به گزارش‌های مدیریتی را ندارید." 
      }, { status: 403 });
    }

    // ۳. دریافت اطلاعات گزارش‌ها (فقط برای ادمین‌های واقعی)
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "15")));
    const skip = (page - 1) * limit;

    const [transactions, totalTransactions, totalRevenueSum] = await Promise.all([
      prisma.transaction.findMany({
        include: { user: { select: { id: true, phone: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }).catch(() => []),
      prisma.transaction.count().catch(() => 0),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "SUCCESS" },
      }).catch(() => ({ _sum: { amount: 0 } })),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalRevenue: totalRevenueSum?._sum?.amount || 0,
        transactions: {
          items: transactions,
          total: totalTransactions,
          page,
          limit,
          totalPages: Math.ceil(totalTransactions / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Admin Reports Critical Error:", error);
    return NextResponse.json({ success: false, message: `خطای سرور: ${error.message}` }, { status: 500 });
  }
}