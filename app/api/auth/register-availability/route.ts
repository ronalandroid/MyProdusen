import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db, users } from '@/lib/db';
import { successResponse, errorResponse } from '@/utils/response';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { handleApiError } from '@/lib/core/route-handler';

/**
 * Inline availability check for the registration form (Baymard: validate
 * while the user can still fix it, not after submit). Booleans only.
 */
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.API_GENERAL, 'register-availability');
    if (rateLimitResult.limited) {
      return errorResponse('Terlalu banyak permintaan. Coba lagi sebentar lagi.', 429);
    }

    const { searchParams } = request.nextUrl ?? new URL(request.url);
    const username = searchParams.get('username')?.trim().toLowerCase() ?? '';
    const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

    const [usernameRow, emailRow] = await Promise.all([
      username ? db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1) : Promise.resolve([]),
      email ? db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1) : Promise.resolve([]),
    ]);

    return successResponse({
      usernameTaken: usernameRow.length > 0,
      emailTaken: emailRow.length > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
