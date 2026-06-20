import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Verification endpoint for Sentry wiring. GET /api/sentry-example?trigger=1
// throws an uncaught error so Next.js's onRequestError forwards it to Sentry.
// Without the trigger it returns instructions, so it can't be hit by accident.
export async function GET(request: NextRequest) {
  const trigger = request.nextUrl.searchParams.get('trigger');

  if (trigger === '1') {
    throw new Error('Sentry verification error — onRequestError forwarding works.');
  }

  return NextResponse.json({
    ok: true,
    message:
      'Add ?trigger=1 to throw a test error that should appear in your Sentry Issues.',
  });
}
