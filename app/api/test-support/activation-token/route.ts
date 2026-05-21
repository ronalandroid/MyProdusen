import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Block in production — this route is for local/staging TestSprite only
  if (process.env.NODE_ENV === 'production' || process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true') {
    return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  // Delegate to the guarded implementation
  const { GET: handler } = await import('@/app/api/auth/public-register-token/route');
  return handler(request as any);
}
