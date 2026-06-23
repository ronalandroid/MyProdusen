import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

/**
 * GET /api/attendance/selfie-review
 * Admin selfie-review list. Returns reviewable check-ins with the real liveness
 * verdict so admins can audit low-confidence / flagged selfies.
 *
 * Query params (all optional): needsReview=true, employeeId, startDate, endDate.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk meninjau absensi.');
    }

    const { searchParams } = new URL(request.url);
    const needsReviewOnly = searchParams.get('needsReview') === 'true';
    const employeeId = searchParams.get('employeeId') || undefined;

    const startParam = searchParams.get('startDate');
    const endParam = searchParams.get('endDate');
    const startDate = startParam ? new Date(startParam) : undefined;
    const endDate = endParam ? new Date(endParam) : undefined;

    if ((startDate && Number.isNaN(startDate.getTime())) || (endDate && Number.isNaN(endDate.getTime()))) {
      return validationErrorResponse('Rentang tanggal tidak valid.');
    }

    const items = await attendanceService.getSelfieReviewList({
      needsReviewOnly,
      employeeId,
      startDate,
      endDate,
    });

    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}
