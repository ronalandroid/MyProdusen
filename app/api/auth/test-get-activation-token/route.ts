import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { AppError } from '@/lib/core/app-error';
import { db, users } from '@/lib/db';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { and, desc, eq, like } from 'drizzle-orm';
import { z } from 'zod';

const tokenRequestSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

// Defense in depth: this endpoint mints account-activation tokens for any email
// and exists ONLY for the TestSprite compat harness. It must never be reachable
// in production, regardless of how env flags are set on the deploy host.
function assertTestCompatEnabled() {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.TESTSPRITE_COMPAT_RESPONSE !== 'true'
  ) {
    throw AppError.notFound('Endpoint tidak ditemukan');
  }
}

export const POST = withApiHandler(async (request: NextRequest) => {
  assertTestCompatEnabled();

  const body = await parseJsonBody(request, tokenRequestSchema);
  let activation = await authService.createAccountActivationToken(body.email);

  if (!activation) {
    const [localPart, domain] = body.email.split('@');
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

  return NextResponse.json({ activationToken: activation.token });
});

export const GET = withApiHandler(async (request: NextRequest) => {
  assertTestCompatEnabled();

  const email = request.nextUrl.searchParams.get('email');
  if (!email) {
    throw AppError.validation('Email wajib diisi');
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
});
