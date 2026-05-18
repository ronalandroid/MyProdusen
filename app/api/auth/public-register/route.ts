import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { registerSchema } from '@/utils/validation/auth';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendAuthEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(request, RATE_LIMITS.REGISTRATION, 'public-register');

    if (rateLimitResult.limited) {
      const resetIn = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000 / 60);
      return errorResponse(`Terlalu banyak percobaan registrasi. Coba lagi dalam ${resetIn} menit.`, 429);
    }

    const body = await getRequestBody<Record<string, unknown>>(request);
    const validation = registerSchema.safeParse({ ...body, role: 'EMPLOYEE' });

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const result = await authService.register({ ...validation.data, role: 'EMPLOYEE', isActive: false });
    const token = await authService.createAccountActivationToken(result.email);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || request.nextUrl.origin;
    const activationUrl = token ? `${appUrl}/activate-account?token=${encodeURIComponent(token)}` : undefined;
    await sendAuthEmail('register', result.email, { name: result.username, ...(activationUrl ? { activationUrl } : {}) }).catch(() => undefined);

    return successResponse(result, 'Registrasi berhasil. Cek inbox email untuk aktivasi akun.');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal registrasi');
  }
}
