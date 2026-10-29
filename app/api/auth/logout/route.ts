import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: "با موفقیت از سیستم خارج شدید" 
    });
    
    // پاک کردن کوکی اصلی احراز هویت پروژه شما (nava_session)
    response.cookies.set({
      name: "nava_session",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // حذف آنی کوکی
      path: "/",
    });

    // اگر کوکی دیگری مثل token هم در پروژه ذخیره می‌شود، آن را هم پاک می‌کنیم
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در خروج از سیستم" },
      { status: 500 }
    );
  }
}