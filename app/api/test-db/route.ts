import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time;`;
    return NextResponse.json({ success: true, time: result });
  } catch (error: any) {
    console.error("Database Test Error:", error);
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: 500 }
    );
  }
}