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
import { leaderService } from '@/services/leader/leader.service';
import { db, employees } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { UserRole } from '@/lib/permissions';
import { z } from 'zod';

import { isTestSpriteCompatEnabled } from '@/lib/testsprite';
const updateUserSchema = z.object({
  userId: z.string().min(1, 'User wajib dipilih'),
  role: z.enum(['SUPERADMIN', 'LEADER', 'EMPLOYEE']).optional(),
  isActive: z.boolean().optional(),
  teamId: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  division: z.string().optional().nullable(),
  defaultLocationId: z.string().optional().nullable(),
  defaultShiftId: z.string().optional().nullable(),
}).refine((data) => data.role || typeof data.isActive === 'boolean' || data.teamId || data.position || data.division || data.defaultLocationId || data.defaultShiftId, {
  message: 'Data perubahan user wajib diisi',
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'USER_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat user');
  }

  const users = await authService.listUsers();

  if (isTestSpriteCompatEnabled()) {
    return NextResponse.json(users.map((row) => ({
      ...row,
      role: row.role === 'SUPERADMIN' ? 'Superadmin' : row.role === 'LEADER' ? 'Leader' : 'Employee',
    })));
  }

  return successResponse(users);
});

export const PATCH = withApiHandler(async (request: NextRequest) => {
  const actor = await requireAuth(request);

  if (!hasPermission(actor.role, 'USER_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk memperbarui user');
  }

  const body = isTestSpriteCompatEnabled()
    ? updateUserSchema.parse(toTestSpriteUserPatch(await request.json().catch(() => undefined)))
    : await parseJsonBody(request, updateUserSchema);
  const currentUser = await authService.getUserSummary(body.userId);
  const nextRole = (body.role ?? currentUser.role) as UserRole;

  if (!canManageRole(actor.role, nextRole)) {
    throw new AppError('ROLE_CHANGE_NOT_ALLOWED', 'Anda tidak memiliki akses untuk mengatur role tersebut', 403);
  }

  if (actor.userId === body.userId && (nextRole !== 'SUPERADMIN' || body.isActive === false)) {
    throw new AppError('CANNOT_SELF_DEMOTE', 'Superadmin tidak dapat menurunkan role atau menonaktifkan akun sendiri', 403);
  }

  if (currentUser.role === 'SUPERADMIN' && (nextRole !== 'SUPERADMIN' || body.isActive === false)) {
    const remainingSuperadmins = await authService.countActiveSuperadmins(body.userId);
    if (remainingSuperadmins < 1) {
      throw new AppError('LAST_SUPERADMIN_PROTECTED', 'Superadmin terakhir tidak boleh dinonaktifkan atau diturunkan role-nya', 403);
    }
  }

  const [employee] = await db.select().from(employees).where(eq(employees.userId, body.userId)).limit(1);

  if (body.division !== undefined || body.position !== undefined || body.defaultLocationId !== undefined || body.defaultShiftId !== undefined) {
    if (!employee) throw new AppError('LEADER_REQUIRES_EMPLOYEE_PROFILE', 'User belum memiliki profil karyawan', 422);
    await db.update(employees).set({
      division: body.division?.trim() || employee.division,
      position: body.position?.trim() || employee.position,
      defaultLocationId: body.defaultLocationId || employee.defaultLocationId,
      defaultShiftId: body.defaultShiftId || employee.defaultShiftId,
      updatedAt: new Date(),
    }).where(eq(employees.id, employee.id));
  }

  const [nextEmployee] = await db.select().from(employees).where(eq(employees.userId, body.userId)).limit(1);

  if (nextRole === 'LEADER') {
    if (!nextEmployee) throw new AppError('LEADER_REQUIRES_EMPLOYEE_PROFILE', 'Leader wajib memiliki profil karyawan', 422);
    if (!nextEmployee.defaultLocationId && !body.defaultLocationId) throw new AppError('EMPLOYEE_REQUIRES_LOCATION', 'Leader wajib memiliki lokasi kerja', 422);
    if (!nextEmployee.defaultShiftId && !body.defaultShiftId) throw new AppError('EMPLOYEE_REQUIRES_SHIFT', 'Leader wajib memiliki shift aktif', 422);
    if (!body.teamId) throw new AppError('LEADER_REQUIRES_TEAM', 'Leader wajib ditetapkan ke tim', 422);
  }

  const updatedUser = await authService.updateUserRole(body.userId, nextRole, body.isActive);

  if (nextEmployee && body.teamId) {
    await leaderService.assignEmployee(actor.userId, nextEmployee.id, body.teamId);
    if (nextRole === 'LEADER') await leaderService.assignLeader(actor.userId, body.userId, body.teamId);
  }

  if (currentUser.role === 'LEADER' && nextRole === 'EMPLOYEE') {
    await leaderService.deactivateLeaderAssignments(body.userId);
  }

  await logAudit(
    actor.userId,
    'UPDATE',
    'User',
    updatedUser.id,
    { role: currentUser.role, isActive: currentUser.isActive },
    { role: updatedUser.role, isActive: updatedUser.isActive, teamId: body.teamId, division: body.division, position: body.position, defaultLocationId: body.defaultLocationId, defaultShiftId: body.defaultShiftId },
    request
  );

  for (const event of getUserEmailEvents(currentUser, updatedUser)) {
    await sendAuthEmail(event, updatedUser.email, { role: updatedUser.role }).catch(() => undefined);
  }

  return successResponse(updatedUser, 'User berhasil diperbarui');
});

function toTestSpriteUserPatch(body: any) {
  if (!body) return body;
  return {
    userId: body.userId ?? body.id,
    role: typeof body.role === 'string' ? body.role.toUpperCase() : body.role,
    isActive: body.isActive ?? body.active,
    teamId: body.teamId,
    position: body.position,
    division: body.division,
    defaultLocationId: body.defaultLocationId,
    defaultShiftId: body.defaultShiftId,
  };
}
