import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function validateAndTouchSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("nava_session")?.value;

  if (!sessionToken) {
    return { error: "Unauthorized", status: 401 };
  }

  // پیدا کردن نشست در دیتابیس
  const session = await (prisma as any).session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session) {
    return { error: "Session not found", status: 401 };
  }

  // تنظیم زمان انقضای عدم فعالیت (مثلاً ۱۵ دقیقه = ۱۵ * ۶۰ * ۱۰۰۰ میلی‌ثانیه)
  const INACTIVITY_LIMIT = 15 * 60 * 1000; 
  const now = new Date().getTime();
  const lastActivity = new Date(session.lastActivityAt).getTime();

  // بررسی اینکه آیا کاربر بیش از حد مجاز غیرفعال بوده است؟
  if (now - lastActivity > INACTIVITY_LIMIT) {
    // حذف سشن از دیتابیس به دلیل عدم فعالیت
    await (prisma as any).session.delete({ where: { id: session.id } });
    
    // پاک کردن کوکی
    cookieStore.delete("nava_session");

    return { error: "Session expired due to inactivity", status: 401 };
  }

  // اگر کاربر فعال بوده است، زمان آخرین فعالیت را به زمان حال به‌روزرسانی کن (Touch)
  await (prisma as any).session.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return { user: session.user };
}