import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { canManageRole, hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { sendAuthEmail } from '@/lib/email';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().min(1, 'User wajib dipilih'),
  role: z.enum(['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => data.role || typeof data.isActive === 'boolean', {
  message: 'Role atau status aktif wajib diisi',
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'USER_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat user');
  }

  const users = await authService.listUsers();
  return successResponse(users);
});

export const PATCH = withApiHandler(async (request: NextRequest) => {
  const actor = await requireAuth(request);

  if (!hasPermission(actor.role, 'USER_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk memperbarui user');
  }

  const body = await parseJsonBody(request, updateUserSchema);
  const currentUser = await authService.getUserSummary(body.userId);
  const nextRole = body.role ?? currentUser.role;

  if (!canManageRole(actor.role, nextRole)) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengatur role tersebut');
  }

  const updatedUser = await authService.updateUserRole(body.userId, nextRole, body.isActive);

  await logAudit(
    actor.userId,
    'UPDATE',
    'User',
    updatedUser.id,
    { role: currentUser.role, isActive: currentUser.isActive },
    { role: updatedUser.role, isActive: updatedUser.isActive },
    request
  );

  const becameActive = currentUser.isActive === false && updatedUser.isActive === true;
  const roleChanged = currentUser.role !== updatedUser.role;

  if (becameActive) {
    await sendAuthEmail('account-approved', updatedUser.email).catch(() => undefined);
  }

  if (roleChanged) {
    await sendAuthEmail('role-changed', updatedUser.email, { role: updatedUser.role }).catch(() => undefined);
  }

  return successResponse(updatedUser, 'User berhasil diperbarui');
});
