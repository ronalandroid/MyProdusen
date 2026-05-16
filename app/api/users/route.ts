import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { withApiHandler } from '@/lib/core/route-handler';

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'USER_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat user');
  }

  const users = await authService.listUsers();
  return successResponse(users);
});
