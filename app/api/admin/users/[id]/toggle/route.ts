import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/adminAuth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🛡️ بررسی امنیتی ادمین
    const authCheck = await verifyAdmin();
    if (!authCheck.success) {
      return NextResponse.json(
        { success: false, message: authCheck.message },
        { status: authCheck.status }
      );
    }

    const { id: targetUserId } = await params;

    // پیدا کردن کاربر مورد نظر
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'کاربر یافت نشد' }, { status: 404 });
    }

    // معکوس کردن وضعیت فعال/مسدود بودن (isActive)
    const currentIsActive = targetUser.isActive ?? true;
    const newIsActive = !currentIsActive;

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { 
        isActive: newIsActive 
      },
    });

    return NextResponse.json({
      success: true,
      message: newIsActive ? 'دسترسی کاربر با موفقیت باز شد' : 'حساب کاربر با موفقیت مسدود شد',
      data: {
        id: updatedUser.id,
        isActive: updatedUser.isActive,
      },
    });

  } catch (error) {
    console.error("Toggle User Status Error:", error);
    return NextResponse.json({ success: false, message: 'خطا در سرور' }, { status: 500 });
  }
}