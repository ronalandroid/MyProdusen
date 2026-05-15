import { NextRequest } from 'next/server';
import { z } from 'zod';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().min(5, 'Catatan review minimal 5 karakter'),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST') && user.role !== 'SUPERVISOR') {
      return forbiddenResponse('Anda tidak memiliki akses review exception absensi');
    }

    const { id } = await params;
    const body = await getRequestBody(request);
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const updated = await attendanceExceptionService.reviewException({
      id,
      reviewerUserId: user.userId,
      status: validation.data.status,
      reviewNote: validation.data.reviewNote,
    });
    await logAudit(user.userId, validation.data.status, 'AttendanceException', id, undefined, updated, request);

    return successResponse(updated, 'Exception absensi berhasil diproses');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal review exception absensi');
  }
}
