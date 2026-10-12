import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "nava-secret-key-2026";

// تابع کمکی مشترک برای احراز هویت ادمین
async function verifyAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("nava_session")?.value;
  if (!sessionToken) return null;

  let adminUserId: string | null = null;
  try {
    const decoded: any = jwt.verify(sessionToken, JWT_SECRET);
    adminUserId = decoded.userId || decoded.id || decoded.sub;
  } catch (e) {
    adminUserId = sessionToken;
  }

  const adminUser = await prisma.user.findFirst({
    where: { OR: [{ id: adminUserId || "" }, { email: adminUserId || "" }] }
  });

  if (!adminUser || (adminUser.isAdmin !== true && adminUser.role !== "ADMIN")) {
    return null;
  }
  return adminUser;
}

// ۱. متد DELETE برای حذف تراکنش و مدیریت وضعیت اشتراک
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const resolvedParams = await params;
    const transactionId = resolvedParams?.id;

    if (!transactionId) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    const targetUserId = transaction.userId;

    await prisma.$transaction(async (tx) => {
      await tx.transaction.delete({
        where: { id: transactionId },
      });

      const remainingSuccessCount = await tx.transaction.count({
        where: {
          userId: targetUserId,
          status: "SUCCESS",
        },
      });

      if (remainingSuccessCount === 0) {
        await tx.user.update({
          where: { id: targetUserId },
          data: {
            isSubscribed: false,
            subscriptionExpiresAt: null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Transaction deleted and user subscription state updated successfully.",
    });
  } catch (error: any) {
    console.error("Admin Transaction Delete Error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ۲. متد POST برای ثبت بسته جدید (یا پیش‌فرض یک‌ماهه) از طریق فرم کشویی
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: "Access denied. Admin privileges required." }, { status: 403 });
    }

    const resolvedParams = await params;
    // در اینجا id می‌تواند userId باشد که از طریق کشو ارسال می‌شود
    const userId = resolvedParams?.id; 

    const body = await request.json().catch(() => ({}));
    const amount = body.amount ? parseFloat(body.amount) : 150000; // مبلغ پیش‌فرض مثلا ۱۵۰ هزار تومان
    const durationMonths = body.durationMonths || 1; // پیش‌فرض بسته یک ماهه

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required." }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    const result = await prisma.$transaction(async (tx) => {
      // ایجاد تراکنش جدید موفق
      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          amount,
          status: "SUCCESS"
        },
      });
      // ایجاد تراکنش جدید موفق


      // فعال‌سازی یا تمدید اشتراک کاربر
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          isSubscribed: true,
          subscriptionExpiresAt: expiresAt,
        },
      });

      return { newTransaction, updatedUser };
    });

    return NextResponse.json({
      success: true,
      message: "Subscription package successfully added and user updated.",
      data: result,
    });
  } catch (error: any) {
    console.error("Admin Add Package Error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}