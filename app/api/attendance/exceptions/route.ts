import { NextRequest } from 'next/server';
import { z } from 'zod';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';
import { employeeService } from '@/services/employees/employee.service';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';
import { isValidEnumParam } from '@/lib/core/query-validation';

const EXCEPTION_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;

const createExceptionSchema = z.object({
  attendanceId: z.string().optional(),
  type: z.enum(['OUTSIDE_GEOFENCE', 'BAD_GPS_ACCURACY', 'MISSING_SELFIE', 'MANUAL_ADJUSTMENT', 'LATE_CORRECTION', 'MISSING_CHECKOUT']),
  reason: z.string().min(5),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    if (!isValidEnumParam(status, EXCEPTION_STATUSES)) {
      return validationErrorResponse('Status pengecualian tidak valid.');
    }
    const employee = await employeeService.getEmployeeByUserId(user.userId).catch(() => null);

    if (!employee && user.role !== 'SUPERADMIN') {
      return errorResponse('Data karyawan tidak ditemukan');
    }
    if (!hasPermission(user.role, 'ATTENDANCE_READ') && !hasPermission(user.role, 'ATTENDANCE_READ_OWN')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    const rows = await attendanceExceptionService.listExceptions({
      status: (status || undefined) as (typeof EXCEPTION_STATUSES)[number] | undefined,
      viewerRole: user.role,
      viewerUserId: user.userId,
      viewerEmployeeId: employee?.id,
    });

    return successResponse(rows.map(({ exception, employee }) => ({ ...exception, employee })));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_CREATE')) return forbiddenResponse('Anda tidak memiliki akses');

    const employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) {
      return errorResponse('Profil karyawan tidak ditemukan', 404);
    }
    const body = await getRequestBody(request);
    const validation = createExceptionSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const created = await attendanceExceptionService.createException({
      attendanceId: validation.data.attendanceId,
      employeeId: employee.id,
      type: validation.data.type,
      reason: validation.data.reason,
      requestedBy: user.userId,
    });
    await logAudit(user.userId, 'CREATE', 'AttendanceException', created.id, undefined, created, request);

    return successResponse(created, 'Exception absensi dibuat');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
