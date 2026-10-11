import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// تابع کمکی احراز هویت
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
    select: { id: true, role: true, isAdmin: true }
  }).catch(() => null);

  if (!user) {
    const activeSession = await prisma.session.findFirst({
      where: { OR: [{ token: tokenValue }, { id: tokenValue }] },
      include: { user: { select: { id: true, role: true, isAdmin: true } } }
    }).catch(() => null);

    if (activeSession?.user) user = activeSession.user;
  }

  return user;
}

// دریافت جزئیات تیکت و علامت‌گذاری به عنوان خوانده‌شده (GET)
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const { id } = await context.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { 
        messages: {
          orderBy: { createdAt: "asc" }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد" }, { status: 404 });
    }

    const isAdminUser = user.isAdmin || user.role === "ADMIN";
    if (ticket.userId !== user.id && !isAdminUser) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    // اگر تیکت هنوز خوانده نشده است، آن را به عنوان خوانده‌شده به‌روزرسانی کن
    if (!ticket.isRead) {
      await prisma.ticket.update({
        where: { id },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ویرایش تیکت (PUT)
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await req.json();
    const { subject, priority } = body;

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد" }, { status: 404 });
    }

    const isAdminUser = user.isAdmin || user.role === "ADMIN";
    if (ticket.userId !== user.id && !isAdminUser) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        subject: subject ? subject.trim() : ticket.subject,
        priority: priority || ticket.priority
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// حذف تیکت (DELETE)
export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const { id } = await context.params;
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد" }, { status: 404 });
    }

    const isAdminUser = user.isAdmin || user.role === "ADMIN";
    if (ticket.userId !== user.id && !isAdminUser) {
      return NextResponse.json({ success: false, message: "دسترسی غیرمجاز" }, { status: 403 });
    }

    // حذف پیام‌های وابسته و سپس خود تیکت
    await prisma.ticketMessage.deleteMany({ where: { ticketId: id } });
    await prisma.ticket.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "تیکت با موفقیت حذف شد" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}