import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/core/route-handler';

export const dynamic = 'force-dynamic';

// Verification endpoint for Sentry's caught-500 path. GET ?trigger=1 throws an
// unexpected error that is caught and routed through handleApiError — the same
// path every API route uses — so it must surface in Sentry Issues. Guarded so
// it can't be hit by accident; safe to remove after verifying.
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get('trigger') !== '1') {
    return NextResponse.json({
      ok: true,
      message: 'Add ?trigger=1 to raise a caught 500 that should reach Sentry.',
    });
  }

  try {
    throw new Error('Sentry caught-500 verification — handleApiError forwarding works.');
  } catch (error) {
    return handleApiError(error);
  }
}
