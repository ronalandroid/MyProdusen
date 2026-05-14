import { NextRequest } from 'next/server';
import { shiftService } from '@/features/shifts/shift.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const createShiftSchema = z.object({
  name: z.string().min(3, 'Nama shift minimal 3 karakter'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format waktu harus HH:MM'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'SHIFT_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data shift');
    }
    
    const { searchParams } = new URL(request.url);
    const isActiveParam = searchParams.get('isActive');
    
    const filters = isActiveParam !== null ? { isActive: isActiveParam === 'true' } : undefined;
    
    const shifts = await shiftService.getShifts(filters);
    
    return successResponse(shifts);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil data shift');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'SHIFT_CREATE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk membuat shift');
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = createShiftSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const shift = await shiftService.createShift(validation.data);
    
    return successResponse(shift, 'Shift berhasil dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal membuat shift');
  }
}
