import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { forgotPasswordSchema } from '@/utils/validation/auth';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { sendAuthEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request);
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const token = await authService.createPasswordResetToken(validation.data.email);
    if (token) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || request.nextUrl.origin;
      await sendAuthEmail('forgot-password', validation.data.email, {
        resetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(token)}`,
      });
    }

    return successResponse(null, 'Jika email terdaftar, link reset password akan dikirim.');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal memproses lupa password');
  }
}
