import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { successResponse } from '@/utils/response';
import { scheduleService } from '@/services/attendance/schedule.service';
import { shiftService } from '@/services/shifts/shift.service';

const setShiftLocationsSchema = z.object({
  workLocationIds: z.array(z.string().min(1)),
});

/**
 * GET /api/attendance/shift-locations/[shiftId]
 * Superadmin: read the default valid work locations configured for a shift.
 * These apply when an employee has no per-day schedule override.
 */
export const GET = withApiHandler<{ shiftId: string }>(async (request: NextRequest, { params }) => {
  const [user, { shiftId }] = await Promise.all([requireAuth(request), params]);

  if (!hasPermission(user.role, 'SHIFT_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat lokasi shift');
  }

  // Validate the shift exists (throws NOT_FOUND otherwise).
  await shiftService.getShiftById(shiftId);

  const workLocationIds = await scheduleService.getShiftLocationIds(shiftId);

  return successResponse({ shiftId, workLocationIds });
});

/**
 * PUT /api/attendance/shift-locations/[shiftId]
 * Superadmin: replace the default valid work locations for a shift.
 * An empty array clears all default locations for the shift.
 */
export const PUT = withApiHandler<{ shiftId: string }>(async (request: NextRequest, { params }) => {
  const [user, { shiftId }] = await Promise.all([requireAuth(request), params]);

  if (!hasPermission(user.role, 'SHIFT_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengubah lokasi shift');
  }

  await shiftService.getShiftById(shiftId);

  const data = await parseJsonBody(request, setShiftLocationsSchema);
  const workLocationIds = [...new Set(data.workLocationIds)];

  const oldIds = await scheduleService.getShiftLocationIds(shiftId);
  const locations = await scheduleService.setShiftLocations(shiftId, workLocationIds);

  await logAudit(
    user.userId,
    'UPDATE',
    'ShiftLocation',
    shiftId,
    { workLocationIds: oldIds },
    { workLocationIds },
    request,
  );

  return successResponse({ shiftId, locations }, 'Lokasi default shift berhasil disimpan');
});
