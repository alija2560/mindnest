import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // پاک کردن کوکی احراز هویت با منقضی کردن آن
    cookieStore.set({
      name: "nava_session",
      value: "",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "با موفقیت خارج شدید" });
  } catch (error) {
    return NextResponse.json({ error: "خطا در خروج از حساب" }, { status: 500 });
  }
}