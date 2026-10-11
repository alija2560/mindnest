import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

// دریافت تنظیمات کاربر (تم و لحن)
export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("nava_session")?.value;

    if (!userId) {
      return NextResponse.json({ error: "احراز هویت انجام نشده است." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tone: true, theme: true }
    });

    if (!user) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("GET Settings Error:", error.message || error);
    return NextResponse.json({ error: "خطای داخلی سرور در دریافت تنظیمات" }, { status: 500 });
  }
}

// ذخیره تنظیمات کاربر (تم و لحن)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tone, theme } = body;

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
        ...(tone && { tone }),
        ...(theme && { theme }),
      },
      select: { tone: true, theme: true }
    });

    return NextResponse.json({
      success: true,
      message: "تنظیمات با موفقیت ذخیره شد.",
      settings: updatedUser,
    });
    
  } catch (error: any) {
    console.error("POST Settings Error:", error.message || error);
    return NextResponse.json(
      { error: "خطایی در سرور هنگام ذخیره تنظیمات رخ داد." },
      { status: 500 }
    );
  }
}