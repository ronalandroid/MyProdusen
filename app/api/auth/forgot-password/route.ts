import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { forgotPasswordSchema } from '@/utils/validation/auth';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { sendAuthEmail } from '@/lib/email';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request);
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const normalizedEmail = validation.data.email.trim().toLowerCase();
    const limit = await rateLimit(request, RATE_LIMITS.PASSWORD_RESET, `forgot-password:${normalizedEmail}`);
    if (limit.limited) {
      return errorResponse('Terlalu banyak permintaan reset password. Coba lagi nanti.', 429);
    }

    const token = await authService.createPasswordResetToken(normalizedEmail);
    if (token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || request.nextUrl.origin;
      await sendAuthEmail('forgot-password', normalizedEmail, {
        resetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(token)}`,
      });
    }

    return successResponse(null, 'Jika email terdaftar, link reset password akan dikirim.');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal memproses lupa password');
  }
}
