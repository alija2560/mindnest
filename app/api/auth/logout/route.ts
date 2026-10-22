import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({ 
      success: true, 
      message: "با موفقیت از سیستم خارج شدید" 
    });
    
    // پاک کردن کوکی احراز هویت با تنظیم انقضای آنی
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // حذف آنی کوکی
      path: "/",
    });

    // اگر احیاناً کوکی دیگری برای نشست (Session) دارید می‌توانید اینجا مشابه بالا اضافه کنید
    // response.cookies.set({ name: "session", value: "", maxAge: 0, path: "/" });

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json(
      { success: false, error: "خطا در خروج از سیستم" },
      { status: 500 }
    );
  }
}