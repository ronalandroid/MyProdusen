import { NextRequest } from 'next/server';
import { db, attendanceExceptions, attendances, employees } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_READ')) return forbiddenResponse('Anda tidak memiliki akses');

    const [row] = await db
      .select({ exception: attendanceExceptions, employee: employees })
      .from(attendanceExceptions)
      .leftJoin(employees, eq(attendanceExceptions.employeeId, employees.id))
      .where(eq(attendanceExceptions.id, params.id))
      .limit(1);

    if (!row) return errorResponse('Exception tidak ditemukan', 404);

    let attendanceEvidence: Record<string, unknown> | null = null;
    if (row.exception.attendanceId) {
      const [att] = await db
        .select({
          id: attendances.id,
          checkInLatitude: attendances.checkInLatitude,
          checkInLongitude: attendances.checkInLongitude,
          checkInAccuracy: attendances.checkInAccuracy,
          checkInDistance: attendances.checkInDistance,
          checkInSelfieUrl: attendances.checkInSelfieUrl,
          checkInTime: attendances.checkInTime,
          checkInGeoStatus: attendances.checkInGeoStatus,
          status: attendances.status,
        })
        .from(attendances)
        .where(eq(attendances.id, row.exception.attendanceId))
        .limit(1);
      if (att) attendanceEvidence = att as Record<string, unknown>;
    }

    return successResponse({ ...row.exception, employee: row.employee, attendance: attendanceEvidence });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
