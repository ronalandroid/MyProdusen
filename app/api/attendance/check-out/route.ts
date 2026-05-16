import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';
import { parseCheckOutRealtimeForm } from '@/lib/attendance/realtime-selfie-form';

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
  let employee: Awaited<ReturnType<typeof employeeService.getEmployeeByUserId>> | null = null;
  try {
    user = await requireAuth(request);
    employee = await employeeService.getEmployeeByUserId(user.userId);
    const { data, selfie } = await parseCheckOutRealtimeForm(request);
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    const attendance = await attendanceService.checkOut({
      employeeId: employee.id,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      selfie,
      deviceInfo: data.deviceInfo,
      ipAddress,
      userAgent,
    });

    return successResponse(attendance, 'Check-out berhasil');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    const trigger = classifyAttendanceExceptionError(error.message || 'Check-out gagal');
    if (trigger && user && employee) {
      await attendanceExceptionService.createException({
        employeeId: employee.id,
        type: trigger.type,
        reason: trigger.reason,
        requestedBy: user.userId,
      });
    }
    return errorResponse(error.message || 'Check-out gagal', error.status || 400);
  }
}
