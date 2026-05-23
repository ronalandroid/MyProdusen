import { NextRequest } from 'next/server';
import { z } from 'zod';
import { authService, type UserRole } from '@/services/auth/auth.service';
import { db, employees } from '@/lib/db';
import { errorResponse, forbiddenResponse, successResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { canManageRole } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { getUserEmailEvents, sendAuthEmail } from '@/lib/email';
import { leaderService } from '@/services/leader/leader.service';
import { eq } from 'drizzle-orm';

const updateRoleSchema = z.object({
  role: z.enum(['SUPERADMIN', 'LEADER', 'EMPLOYEE']),
  isActive: z.boolean().optional(),
  teamId: z.string().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAuth(request);
    const { id } = await params;

    if (actor.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengatur role user');

    const body = await getRequestBody(request);
    const validation = updateRoleSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    if (!canManageRole(actor.role, validation.data.role as UserRole)) return forbiddenResponse('ROLE_CHANGE_NOT_ALLOWED: Anda tidak memiliki akses untuk role tersebut');
    if (actor.userId === id && (validation.data.role !== 'SUPERADMIN' || validation.data.isActive === false)) return forbiddenResponse('CANNOT_SELF_DEMOTE: Superadmin tidak dapat menurunkan role atau menonaktifkan akun sendiri');

    const currentUser = await authService.getUserSummary(id);
    if (currentUser.role === 'SUPERADMIN' && (validation.data.role !== 'SUPERADMIN' || validation.data.isActive === false)) {
      const remainingSuperadmins = await authService.countActiveSuperadmins(id);
      if (remainingSuperadmins < 1) return forbiddenResponse('LAST_SUPERADMIN_PROTECTED: Superadmin terakhir tidak boleh dinonaktifkan atau diturunkan role-nya');
    }

    const [employee] = await db.select().from(employees).where(eq(employees.userId, id)).limit(1);
    if (validation.data.role === 'LEADER') {
      if (!employee) return validationErrorResponse('LEADER_REQUIRES_EMPLOYEE_PROFILE: Leader wajib memiliki profil karyawan');
      if (!employee.defaultLocationId) return validationErrorResponse('EMPLOYEE_REQUIRES_LOCATION: Leader wajib memiliki lokasi kerja');
      if (!employee.defaultShiftId) return validationErrorResponse('EMPLOYEE_REQUIRES_SHIFT: Leader wajib memiliki shift aktif');
      if (!validation.data.teamId) return validationErrorResponse('LEADER_REQUIRES_TEAM: Leader wajib ditetapkan ke tim');
    }

    const updated = await authService.updateUserRole(id, validation.data.role as UserRole, validation.data.isActive);
    if (employee && validation.data.teamId) {
      await leaderService.assignEmployee(actor.userId, employee.id, validation.data.teamId);
      if (validation.data.role === 'LEADER') await leaderService.assignLeader(actor.userId, id, validation.data.teamId);
    }
    if (currentUser.role === 'LEADER' && validation.data.role === 'EMPLOYEE') await leaderService.deactivateLeaderAssignments(id);

    await logAudit(actor.userId, 'UPDATE_ROLE', 'User', id, { role: currentUser.role, isActive: currentUser.isActive }, updated, request);
    for (const event of getUserEmailEvents(currentUser, updated)) await sendAuthEmail(event, updated.email, { role: updated.role }).catch(() => undefined);
    return successResponse(updated, 'Role user berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengubah role user', error.status || 400);
  }
}
