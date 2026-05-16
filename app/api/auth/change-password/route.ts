import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { changePasswordSchema } from '@/utils/validation/auth';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { logAudit } from '@/lib/audit';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);
  const { currentPassword, newPassword } = await parseJsonBody(request, changePasswordSchema);

  const result = await authService.changePassword(user.userId, currentPassword, newPassword);
  await logAudit(user.userId, 'CHANGE_PASSWORD', 'User', user.userId, undefined, { userId: user.userId }, request);

  return successResponse(result, 'Password berhasil diubah');
});
