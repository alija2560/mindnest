import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'هیچ فایلی ارسال نشده است' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `audio_${Date.now()}_${file.name || 'voice.webm'}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads');

    await writeFile(path.join(uploadDir, filename), buffer);

    const audioUrl = `/uploads/${filename}`;
    return NextResponse.json({ success: true, audioUrl });
  } catch (error) {
    console.error('Error uploading audio:', error);
    return NextResponse.json({ success: false, error: 'خطا در آپلود فایل صوتی' }, { status: 500 });
  }
}