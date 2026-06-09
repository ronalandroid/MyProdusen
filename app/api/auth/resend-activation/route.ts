import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { resendActivationSchema } from '@/utils/validation/auth';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendAuthEmail } from '@/lib/email';
import { getCanonicalAppUrl } from '@/lib/app-url';
import { handleApiError } from '@/lib/core/route-handler';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.REGISTRATION, 'resend-activation');

    if (rateLimitResult.limited) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
      return errorResponse(`Terlalu banyak percobaan kirim aktivasi. Coba lagi dalam ${resetIn} menit.`, 429);
    }

    const body = await getRequestBody<Record<string, unknown>>(request);
    const validation = resendActivationSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const activation = await authService.createAccountActivationToken(validation.data.identifier);
    if (activation) {
      const appUrl = getCanonicalAppUrl(request.nextUrl.origin);
      const activationUrl = `${appUrl}/activate-account?token=${encodeURIComponent(activation.token)}`;
      await sendAuthEmail('register', activation.email, { activationUrl });
    }

    return successResponse(null, 'Jika akun belum aktif, link aktivasi sudah dikirim ke inbox email.');
  } catch (error: any) {
    return handleApiError(error);
  }
}
