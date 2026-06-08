import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { successResponse } from '@/utils/response';
import { scheduleService } from '@/services/attendance/schedule.service';

/**
 * DELETE /api/attendance/schedules/[id]
 * Superadmin: deactivate a per-day schedule (soft delete). The employee then
 * falls back to their default shift for that day.
 */
export const DELETE = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const [user, { id }] = await Promise.all([requireAuth(request), params]);

  if (!hasPermission(user.role, 'ATTENDANCE_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk menghapus jadwal');
  }

  await scheduleService.deactivateSchedule(id);
  await logAudit(user.userId, 'DEACTIVATE', 'EmployeeSchedule', id, undefined, undefined, request);

  return successResponse({ id, isActive: false }, 'Jadwal berhasil dihapus');
});
