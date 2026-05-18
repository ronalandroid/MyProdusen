import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { errorResponse, successResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody } from '@/lib/middleware';
import { sendAuthEmail } from '@/lib/email';
import { z } from 'zod';

const activateSchema = z.object({
  token: z.string().min(1, 'Token aktivasi wajib diisi'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await getRequestBody<Record<string, unknown>>(request);
    const validation = activateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const result = await authService.activateAccount(validation.data.token);
    await sendAuthEmail('account-approved', result.email).catch(() => undefined);

    return successResponse(result, 'Akun berhasil diaktivasi. Silakan login.');
  } catch (error: any) {
    return errorResponse(error.message || 'Gagal aktivasi akun');
  }
}
