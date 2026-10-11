import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; 
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('nava_session')?.value;

    if (!userId) {
      return NextResponse.json({ success: false, message: 'عدم احراز هویت. لطفا وارد شوید.' }, { status: 401 });
    }

    // پیدا کردن کاربر جاری
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    // بررسی دسترسی ادمین (بر اساس فیلد isAdmin یا role)
    if (!currentUser || (!currentUser.isAdmin && currentUser.role !== 'ADMIN' as any)) {
      return NextResponse.json({ success: false, message: 'شما دسترسی ادمین ندارید.' }, { status: 403 });
    }

    // دریافت لیست کاربران از دیتابیس (سازگار با سیستم اشتراک زمانی جدید)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        messageCount: true,
        isActive: true,
        createdAt: true,
        isAdmin: true,
        role: true,
        isSubscribed: true,
        subscriptionExpiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalUsers = users.length;

    // محاسبه مجموع درآمدهای تراکنش‌های موفق
    let totalRevenue = 0;
    try {
      const aggregateResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
      });
      totalRevenue = aggregateResult._sum.amount || 0;
    } catch (e) {
      totalRevenue = 0;
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalRevenue,
        users,
      },
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, message: "خطا در دریافت اطلاعات ادمین از سرور" }, { status: 500 });
  }
}