import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { resetPasswordSchema } from '@/utils/validation/auth';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { sendAuthEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody(request);
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const result = await authService.resetPassword(validation.data.token, validation.data.password);
    await sendAuthEmail('reset-password', result.email);

    return successResponse({ userId: result.userId }, 'Password berhasil direset');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal reset password');
  }
}
