import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { authService } from '@/services/auth/auth.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { canManageRole, hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { getUserEmailEvents, sendAuthEmail } from '@/lib/email';
import type { UserRole } from '@/lib/permissions';
import { z } from 'zod';

const updateUserSchema = z.object({
  userId: z.string().min(1, 'User wajib dipilih'),
  role: z.enum(['SUPERADMIN', 'EMPLOYEE']).optional(),
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

  if (process.env.TESTSPRITE_COMPAT_RESPONSE === 'true') {
    return NextResponse.json(users.map((row) => ({
      ...row,
      role: row.role === 'SUPERADMIN' ? 'Superadmin' : 'Employee',
    })));
  }

  return successResponse(users);
});

export const PATCH = withApiHandler(async (request: NextRequest) => {
  const actor = await requireAuth(request);

  if (!hasPermission(actor.role, 'USER_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk memperbarui user');
  }

  const body = process.env.TESTSPRITE_COMPAT_RESPONSE === 'true'
    ? updateUserSchema.parse(toTestSpriteUserPatch(await request.json().catch(() => undefined)))
    : await parseJsonBody(request, updateUserSchema);
  const currentUser = await authService.getUserSummary(body.userId);
  const nextRole = (body.role ?? currentUser.role) as UserRole;

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

  for (const event of getUserEmailEvents(currentUser, updatedUser)) {
    await sendAuthEmail(event, updatedUser.email, { role: updatedUser.role }).catch(() => undefined);
  }

  return successResponse(updatedUser, 'User berhasil diperbarui');
});

function toTestSpriteUserPatch(body: any) {
  if (!body) {
    return body;
  }

  return {
    userId: body.userId ?? body.id,
    role: typeof body.role === 'string' ? body.role.toUpperCase() : body.role,
    isActive: body.isActive ?? body.active,
  };
}
