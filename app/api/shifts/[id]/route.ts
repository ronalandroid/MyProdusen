import { NextRequest } from 'next/server';
import { shiftService } from '@/services/shifts/shift.service';
import { successResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { AppError } from '@/lib/core/app-error';
import { parseJsonBody, withApiHandler } from '@/lib/core/route-handler';

const updateShiftSchema = z.object({
  name: z.string().min(3, 'Nama shift minimal 3 karakter').optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu harus HH:MM').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu harus HH:MM').optional(),
  isActive: z.boolean().optional(),
});

export const GET = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'SHIFT_READ')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk melihat shift');
  }

  const { id } = await params;
  const shift = await shiftService.getShiftById(id);

  return successResponse(shift);
});

export const PUT = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'SHIFT_UPDATE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk mengubah shift');
  }

  const data = await parseJsonBody(request, updateShiftSchema);
  const { id } = await params;
  const oldShift = await shiftService.getShiftById(id);
  const shift = await shiftService.updateShift(id, data);
  await logAudit(user.userId, 'UPDATE', 'Shift', id, oldShift, shift, request);

  return successResponse(shift, 'Shift berhasil diubah');
});

export const DELETE = withApiHandler<{ id: string }>(async (request: NextRequest, { params }) => {
  const user = await requireAuth(request);

  if (!hasPermission(user.role, 'SHIFT_DELETE')) {
    throw AppError.forbidden('Anda tidak memiliki akses untuk menghapus shift');
  }

  const { id } = await params;
  const oldShift = await shiftService.getShiftById(id);
  const result = await shiftService.deleteShift(id);
  await logAudit(user.userId, 'DELETE', 'Shift', id, oldShift, undefined, request);

  return successResponse(result, result.message);
});
