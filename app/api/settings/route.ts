import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// دریافت تنظیمات برای ادمین
export async function GET() {
  try {
    let settings = await (prisma as any).systemSetting.findFirst();
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
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ذخیره تغییرات ادمین
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let settings = await (prisma as any).systemSetting.findFirst();

    if (!settings) {
      settings = await (prisma as any).systemSetting.create({
        data: {
          initialGiftLimit: Number(body.initialGiftLimit),
          dailyFreeLimit: Number(body.dailyFreeLimit),
          monthly1Credits: Number(body.monthly1Credits),
          monthly1Price: Number(body.monthly1Price),
          monthly3Credits: Number(body.monthly3Credits),
          monthly3Price: Number(body.monthly3Price),
          monthly6Credits: Number(body.monthly6Credits),
          monthly6Price: Number(body.monthly6Price),
        },
      });
    } else {
      settings = await (prisma as any).systemSetting.update({
        where: { id: settings.id },
        data: {
          initialGiftLimit: Number(body.initialGiftLimit),
          dailyFreeLimit: Number(body.dailyFreeLimit),
          monthly1Credits: Number(body.monthly1Credits),
          monthly1Price: Number(body.monthly1Price),
          monthly3Credits: Number(body.monthly3Credits),
          monthly3Price: Number(body.monthly3Price),
          monthly6Credits: Number(body.monthly6Credits),
          monthly6Price: Number(body.monthly6Price),
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}