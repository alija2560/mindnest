import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
    const cookieStore = await cookies();
    const adminId = cookieStore.get('nava_session')?.value;

    if (!adminId) {
      return NextResponse.json({ success: false, message: 'عدم احراز هویت' }, { status: 401 });
    }

    // بررسی اینکه درخواست‌دهنده خودش ادمین باشد
    const currentAdmin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!currentAdmin || (!currentAdmin.isAdmin && currentAdmin.role !== 'ADMIN' as any)) {
      return NextResponse.json({ success: false, message: 'شما دسترسی ادمین ندارید' }, { status: 403 });
    }

    // پیدا کردن کاربر مورد نظر
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'کاربر یافت نشد' }, { status: 404 });
    }

    // معکوس کردن وضعیت ادمین بودن (اگر ادمین است عادی شود، اگر عادی است ادمین شود)
    const newIsAdmin = !targetUser.isAdmin;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        isAdmin: newIsAdmin,
        role: newIsAdmin ? ('ADMIN' as any) : ('USER' as any) // بسته به اینکه از role یا isAdmin استفاده می‌کنید
      },
    });

    return NextResponse.json({
      success: true,
      message: newIsAdmin ? 'کاربر با موفقیت به ادمین ارتقاء یافت' : 'دسترسی ادمین از کاربر گرفته شد',
      data: {
        id: updatedUser.id,
        isAdmin: updatedUser.isAdmin,
      },
    });

  } catch (error) {
    console.error("Toggle Admin Error:", error);
    return NextResponse.json({ success: false, message: 'خطا در سرور' }, { status: 500 });
  }
}