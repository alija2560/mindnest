import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// دریافت اطلاعات کاربر برای نمایش در فرم (هنگام لود صفحه)
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "احراز هویت انجام نشده است." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true, email: true, tone: true }
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "خطای سرور در دریافت اطلاعات" }, { status: 500 });
  }
}

// ذخیره اطلاعات پروفایل کاربر در دیتابیس
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { name, email, tone } = body;

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "وارد کردن نام کاربری الزامی است." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "لطفاً ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { 
        name: name.trim(),
        email: email ? email.trim() : null,
        tone: tone || "friendly",
      },
    });

    return NextResponse.json({
      success: true,
      message: "پروفایل با موفقیت به‌روزرسانی شد.",
      user: { 
        name: updatedUser.name, 
        phone: updatedUser.phone, 
        email: updatedUser.email,
        tone: updatedUser.tone 
      },
    });
    
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "خطایی در سرور هنگام ذخیره اطلاعات رخ داد." },
      { status: 500 }
    );
  }
}