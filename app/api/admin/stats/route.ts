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

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser || (!currentUser.isAdmin && currentUser.role !== 'ADMIN' as any)) {
      return NextResponse.json({ success: false, message: 'شما دسترسی ادمین ندارید.' }, { status: 403 });
    }

    // خواندن پارامترهای صفحه‌بندی و جستجو از URL
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          OR: [
            { phone: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    // اجرای موازی برای بهینه‌سازی فوق‌العاده سرعت پاسخ‌دهی
    const [totalUsers, users, aggregateResult] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({
        where: whereClause,
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
        skip: skip,
        take: limit,
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
      }).catch(() => ({ _sum: { amount: 0 } }))
    ]);

    const totalRevenue = aggregateResult._sum.amount || 0;
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPages,
        currentPage: page,
        totalRevenue,
        users,
      },
    });

  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, message: "خطا در دریافت اطلاعات ادمین از سرور" }, { status: 500 });
  }
}