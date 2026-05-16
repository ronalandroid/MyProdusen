import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authService, type UserRole } from '@/services/auth/auth.service';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { canManageRole } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { sendAuthEmail } from '@/lib/email';

const updateRoleSchema = z.object({
  role: z.enum(['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR', 'EMPLOYEE']),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth(request);
    const { id } = await params;

    if (actor.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat mengatur role user');
    }

    const body = await getRequestBody(request);
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    if (!canManageRole(actor.role, validation.data.role as UserRole)) {
      return forbiddenResponse('Anda tidak memiliki akses untuk role tersebut');
    }

    const updated = await authService.updateUserRole(id, validation.data.role as UserRole, validation.data.isActive);
    await logAudit(actor.userId, 'UPDATE_ROLE', 'User', id, undefined, updated, request);
    await sendAuthEmail('role-changed', updated.email, { role: updated.role }).catch(() => undefined);

    if (updated.isActive) {
      await sendAuthEmail('account-approved', updated.email).catch(() => undefined);
    }

    return successResponse(updated, 'Role user berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memperbarui role user');
  }
}
