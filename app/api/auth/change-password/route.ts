import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { changePasswordSchema } from '@/utils/validation/auth';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { withApiHandler } from '@/lib/core/route-handler';

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const body = await request.json().catch(() => undefined);
  const compatibleBody = process.env.TESTSPRITE_COMPAT_RESPONSE === 'true' && body
    ? {
      ...body,
      currentPassword: body.currentPassword ?? body.oldPassword,
      confirmPassword: body.confirmPassword ?? body.newPassword,
    }
    : body;
  const validation = changePasswordSchema.safeParse(compatibleBody);

  if (!validation.success) {
    throw AppError.validation(validation.error.errors[0]?.message || 'Payload tidak valid');
  }

  const { currentPassword, newPassword } = validation.data;

  const result = await authService.changePassword(user.userId, currentPassword, newPassword);
  await logAudit(user.userId, 'CHANGE_PASSWORD', 'User', user.userId, undefined, { userId: user.userId }, request);

  return successResponse(result, 'Password berhasil diubah');
});
