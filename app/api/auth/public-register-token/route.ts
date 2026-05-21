import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { AppError } from '@/lib/core/app-error';
import { db, users } from '@/lib/db';
import { and, desc, eq, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true') {
    return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ success: false, error: 'VALIDATION_ERROR' }, { status: 422 });
  }

  let activation = await authService.createAccountActivationToken(email);
  if (!activation) {
    const [localPart, domain] = email.split('@');
    const [latestCompatibleUser] = await db
      .select({ email: users.email })
      .from(users)
      .where(and(like(users.email, `${localPart}_%@${domain}`), eq(users.isActive, false)))
      .orderBy(desc(users.createdAt))
      .limit(1);
    if (latestCompatibleUser) {
      activation = await authService.createAccountActivationToken(latestCompatibleUser.email);
    }
  }

  if (!activation) {
    throw AppError.notFound('Token aktivasi tidak ditemukan');
  }

  return NextResponse.json({ token: activation.token, activationToken: activation.token });
}
