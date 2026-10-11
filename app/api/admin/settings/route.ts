import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// دریافت تنظیمات سیستم
export async function GET() {
  try {
    let settings = await (prisma as any).systemSetting.findFirst();
    
    // اگر تنظیماتی وجود نداشت، مقادیر پیش‌فرض را ایجاد کن
    if (!settings) {
      settings = await (prisma as any).systemSetting.create({
        data: {
          initialGiftLimit: 50,
          dailyFreeLimit: 5,
          monthly1Credits: 200,
          monthly1Price: 99000,
          monthly3Credits: 700,
          monthly3Price: 249000,
          monthly6Credits: 1600,
          monthly6Price: 449000,
        },
      });
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// به‌روزرسانی تنظیمات سیستم توسط ادمین
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      initialGiftLimit,
      dailyFreeLimit,
      monthly1Credits,
      monthly1Price,
      monthly3Credits,
      monthly3Price,
      monthly6Credits,
      monthly6Price,
    } = body;

    let settings = await (prisma as any).systemSetting.findFirst();

    if (settings) {
      settings = await (prisma as any).systemSetting.update({
        where: { id: settings.id },
        data: {
          initialGiftLimit: Number(initialGiftLimit),
          dailyFreeLimit: Number(dailyFreeLimit),
          monthly1Credits: Number(monthly1Credits),
          monthly1Price: Number(monthly1Price),
          monthly3Credits: Number(monthly3Credits),
          monthly3Price: Number(monthly3Price),
          monthly6Credits: Number(monthly6Credits),
          monthly6Price: Number(monthly6Price),
        },
      });
    } else {
      settings = await (prisma as any).systemSetting.create({
        data: {
          initialGiftLimit: Number(initialGiftLimit) || 50,
          dailyFreeLimit: Number(dailyFreeLimit) || 5,
          monthly1Credits: Number(monthly1Credits) || 200,
          monthly1Price: Number(monthly1Price) || 99000,
          monthly3Credits: Number(monthly3Credits) || 700,
          monthly3Price: Number(monthly3Price) || 249000,
          monthly6Credits: Number(monthly6Credits) || 1600,
          monthly6Price: Number(monthly6Price) || 449000,
        },
      });
    }

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}