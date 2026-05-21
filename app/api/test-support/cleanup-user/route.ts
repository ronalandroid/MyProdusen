import { NextResponse } from 'next/server';

export async function POST() {
  // Block in production — this route is for local/staging TestSprite only
  if (process.env.NODE_ENV === 'production' || process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true') {
    return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
