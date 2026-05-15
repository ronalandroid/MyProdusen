import { NextRequest } from 'next/server';
import { shiftService } from '@/services/shifts/shift.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const updateShiftSchema = z.object({
  name: z.string().min(3, 'Nama shift minimal 3 karakter').optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu harus HH:MM').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format waktu harus HH:MM').optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'SHIFT_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat shift');
    }
    
    const shift = await shiftService.getShiftById((await context.params).id);
    
    return successResponse(shift);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Shift tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengambil data shift');
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'SHIFT_UPDATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk mengubah shift');
    }
    
    const body = await getRequestBody(request);
    
    const validation = updateShiftSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { id } = await context.params;
    const oldShift = await shiftService.getShiftById(id);
    const shift = await shiftService.updateShift(id, validation.data);
    await logAudit(user.userId, 'UPDATE', 'Shift', id, oldShift, shift, request);
    
    return successResponse(shift, 'Shift berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Shift tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengubah shift');
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'SHIFT_DELETE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menghapus shift');
    }
    
    const { id } = await context.params;
    const oldShift = await shiftService.getShiftById(id);
    const result = await shiftService.deleteShift(id);
    await logAudit(user.userId, 'DELETE', 'Shift', id, oldShift, undefined, request);
    
    return successResponse(result, result.message);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Shift tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menghapus shift');
  }
}
