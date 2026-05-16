import { NextRequest } from 'next/server';
import { shiftService } from '@/services/shifts/shift.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const createShiftSchema = z.object({
  name: z.string().min(3, 'Nama shift minimal 3 karakter'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
});

export const GET = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'SHIFT_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat data shift');
  }

  const { searchParams } = new URL(request.url);
  const isActiveParam = searchParams.get('isActive');
  const filters = isActiveParam !== null ? { isActive: isActiveParam === 'true' } : undefined;
  const shifts = await shiftService.getShifts(filters);

  return successResponse(shifts);
});

export const POST = withApiHandler(async (request: NextRequest) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'SHIFT_CREATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk membuat shift');
  }

  const data = await parseJsonBody(request, createShiftSchema);
  const shift = await shiftService.createShift(data);
  await logAudit(user.userId, 'CREATE', 'Shift', shift.id, undefined, shift, request);

  return successResponse(shift, 'Shift berhasil dibuat');
});
