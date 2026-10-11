import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get("nava_session")?.value;

  // اگر کاربر صفحه ورود نیست و توکن ندارد، به صفحه لاگین هدایت شود
  const isAuthPage = req.nextUrl.pathname.startsWith("/login");
  
  if (!sessionToken && !isAuthPage && !req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.json ? NextResponse.next() : NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*", "/credit/:path*"],
};