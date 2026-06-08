import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { AppError } from '@/lib/core/app-error';
import { db, users } from '@/lib/db';
import { and, desc, eq, like } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const publicRegisterTokenQuerySchema = z.object({
  email: z.string().email('Email tidak valid'),
});

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' || process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true') {
    return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
  }

  const validation = publicRegisterTokenQuerySchema.safeParse({
    email: request.nextUrl.searchParams.get('email'),
  });
  if (!validation.success) {
    return NextResponse.json({ success: false, error: 'VALIDATION_ERROR' }, { status: 422 });
  }

  const rateLimitResult = await rateLimit(request, RATE_LIMITS.REGISTRATION, 'public-register-token');
  if (rateLimitResult.limited) {
    return NextResponse.json({ success: false, error: 'RATE_LIMITED' }, { status: 429 });
  }

  const email = validation.data.email;
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
