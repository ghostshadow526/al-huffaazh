import { NextResponse } from 'next/server';
import imagekit from '@/lib/imagekit';

export async function GET() {
  try {
    const result = imagekit.getAuthenticationParameters();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting ImageKit auth params:", error);
    return NextResponse.json({ message: 'Error getting auth params' }, { status: 500 });
  }
}
