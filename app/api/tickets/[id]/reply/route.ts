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

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "عدم احراز هویت" }, { status: 401 });
    }

    const params = await context.params;
    const ticketId = params.id;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, message: "متن پاسخ الزامی است." }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "تیکت یافت نشد." }, { status: 404 });
    }

    const isAdminUser = user.isAdmin || user.role === "ADMIN";

    // ثبت پیام جدید در چت تیکت
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        message: message.trim()
      }
    });

    // به‌روزرسانی وضعیت و فیلد hasUnreadResponse
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: isAdminUser ? "ANSWERED" : "OPEN",
        hasUnreadResponse: isAdminUser ? true : false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}