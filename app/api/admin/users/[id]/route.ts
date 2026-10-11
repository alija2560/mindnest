import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// متد GET
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string; targetUserId?: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id || resolvedParams.targetUserId;
    
    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر مشخص نشده است." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر مورد نظر یافت نشد." }, { status: 404 });
    }

    const globalSettings = await prisma.systemSetting.findFirst();

    return NextResponse.json({
      user,
      globalSettings: globalSettings || {
        initialGiftLimit: 50,
        monthly1Price: 99000,
        monthly3Price: 249000,
        monthly6Price: 449000,
      },
    });
  } catch (error) {
    console.error("Error fetching user admin data:", error);
    return NextResponse.json({ error: "خطای سرور در دریافت اطلاعات کاربر" }, { status: 500 });
  }
}

// متد POST
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id?: string; targetUserId?: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.id || resolvedParams.targetUserId;
    
    if (!userId) {
      return NextResponse.json({ error: "شناسه کاربر مشخص نشده است." }, { status: 400 });
    }

    const body = await req.json();
    const {
      messageCount,
      subscriptionExpiresAt,
      resetBonus,
      isAdmin,
      addCredit,
      isSubscribed,
      customMonthly1Price,
      customMonthly3Price,
      customMonthly6Price,
    } = body;

    const updateData: any = {};

    if (messageCount !== undefined) {
      updateData.messageCount = parseInt(messageCount) || 0;
    }

    if (addCredit && parseInt(addCredit) > 0) {
      const currentUser = await prisma.user.findUnique({ where: { id: userId } });
      if (currentUser) {
        updateData.messageCount = (currentUser.messageCount || 0) + parseInt(addCredit);
      }
    }

    if (isAdmin !== undefined) {
      updateData.isAdmin = Boolean(isAdmin);
    }

    if (isSubscribed !== undefined) {
      updateData.isSubscribed = Boolean(isSubscribed);
    }

    if (subscriptionExpiresAt !== undefined) {
      updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    }

    if (resetBonus) {
      updateData.hasReceivedFirstBonus = false;
    }

    updateData.customMonthly1Price =
      customMonthly1Price !== "" && customMonthly1Price !== null && customMonthly1Price !== undefined
        ? parseInt(customMonthly1Price)
        : null;

    updateData.customMonthly3Price =
      customMonthly3Price !== "" && customMonthly3Price !== null && customMonthly3Price !== undefined
        ? parseInt(customMonthly3Price)
        : null;

    updateData.customMonthly6Price =
      customMonthly6Price !== "" && customMonthly6Price !== null && customMonthly6Price !== undefined
        ? parseInt(customMonthly6Price)
        : null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "اطلاعات کاربر با موفقیت به‌روزرسانی شد.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user admin data:", error);
    return NextResponse.json({ error: "خطا در ذخیره‌سازی اطلاعات کاربر" }, { status: 500 });
  }
}