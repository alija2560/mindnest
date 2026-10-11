import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const sessionCookie = 
    cookieStore.get("nava_session") || 
    cookieStore.get("token") || 
    cookieStore.get("auth_token") || 
    cookieStore.get("session") ||
    cookieStore.get("next-auth.session-token");

  if (!sessionCookie) return null;

  const tokenValue = sessionCookie.value;
  let user = await prisma.user.findUnique({
    where: { id: tokenValue },
    select: { id: true, role: true, isAdmin: true, name: true, phone: true }
  }).catch(() => null);

  if (!user) {
    const activeSession = await prisma.session.findFirst({
      where: { OR: [{ token: tokenValue }, { id: tokenValue }] },
      include: { user: { select: { id: true, role: true, isAdmin: true, name: true, phone: true } } }
    }).catch(() => null);

    if (activeSession?.user) user = activeSession.user;
  }

  return user;
}

// دریافت لیست تیکت‌ها (اگر ادمین باشد همه، اگر کاربر عادی باشد فقط تیکت‌های خودش)
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const isAdminUser = user.isAdmin || user.role === "ADMIN";

    const tickets = await prisma.ticket.findMany({
      where: isAdminUser ? {} : { userId: user.id },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        messages: { orderBy: { createdAt: "asc" } }
      },
      orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json({ success: true, data: tickets, isAdmin: isAdminUser });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ایجاد تیکت جدید توسط کاربر
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message, priority } = body;

    if (!subject || !message) {
      return NextResponse.json({ success: false, message: "موضوع و متن پیام الزامی است." }, { status: 400 });
    }

    // ایجاد تیکت و ثبت اولین پیام آن در یک تراکنش
    const newTicket = await prisma.ticket.create({
      data: {
        userId: user.id,
        subject: subject.trim(),
        priority: priority || "MEDIUM",
        status: "OPEN",
        hasUnreadResponse: false,
        messages: {
          create: {
            senderId: user.id,
            message: message.trim()
          }
        }
      },
      include: {
        messages: true
      }
    });

    return NextResponse.json({ success: true, data: newTicket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}