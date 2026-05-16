import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { loginSchema } from '@/utils/validation/auth';
import { successResponse } from '@/utils/response';
import { setAuthCookieOnResponse } from '@/lib/auth-response';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

export const POST = withApiHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.LOGIN);

  if (rateLimitResult.limited) {
    const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
    throw AppError.rateLimited(`Terlalu banyak percobaan login. Coba lagi dalam ${resetIn} menit.`);
  }

  const { email, password } = await parseJsonBody(request, loginSchema);
  const result = await authService.login(email, password);

  const response = successResponse(
    {
      user: result.user,
    },
    'Login berhasil',
  );

  return setAuthCookieOnResponse(response, result.token);
});
