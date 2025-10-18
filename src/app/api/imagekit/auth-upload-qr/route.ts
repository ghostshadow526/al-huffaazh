
import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file, fileName } = body;

    if (!file || !fileName) {
      return NextResponse.json({ message: 'Missing file or fileName' }, { status: 400 });
    }

    const result = await imagekit.upload({
      file: file, // base64 data URI
      fileName: fileName,
      folder: "/qrcodes",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error uploading QR to ImageKit:", error);
    return NextResponse.json({ message: 'Error uploading QR code', error: error.message }, { status: 500 });
  }
}
