import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("nava_session")?.value;

  const isAuthPage = pathname.startsWith("/login");

  // ۱. بررسی مسیرهای محافظت‌شده
  const isProtectedRoute = 
    pathname.startsWith("/chat") || 
    pathname.startsWith("/admin") || 
    pathname.startsWith("/credit");

  // ۲. اگر کاربر توکن ندارد و می‌خواهد وارد بخش‌های محافظت‌شده شود
  if (!sessionToken && isProtectedRoute) {
    const loginUrl = new URL("/login", req.url);
    // ذخیره آدرس فعلی کاربر تا پس از ورود موفق، دوباره به همین صفحه برگردد
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ۳. اگر کاربر از قبل لاگین کرده است و دوباره به صفحه /login می‌رود، هدایت به صفحه چت
  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // ایجاد پاسخ پیش‌فرض برای ادامه مسیر
  const response = NextResponse.next();

  // ۴. غیرفعال کردن کش مرورگر (BFCache) برای مسیرهای محافظت‌شده 
  // تا با زدن دکمه Back بعد از خروج (Logout)، صفحه چت دوباره نمایش داده نشود
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

// مچر جامع برای پوشش مسیرهای حساس شما به همراه صفحه لاگین
export const config = {
  matcher: [
    "/chat/:path*", 
    "/admin/:path*", 
    "/credit/:path*", 
    "/login"
  ],
};