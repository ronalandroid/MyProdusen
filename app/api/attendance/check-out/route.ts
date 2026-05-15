import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { checkOutSchema } from '@/utils/validation/attendance';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/utils/response';
import { getRequestBody, requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { attendanceExceptionService } from '@/features/attendance/attendance-exception.service';
import { classifyAttendanceExceptionError } from '@/lib/attendance/exception-policy';

export async function POST(request: NextRequest) {
  let user: Awaited<ReturnType<typeof requireAuth>> | null = null;
  let employee: Awaited<ReturnType<typeof employeeService.getEmployeeByUserId>> | null = null;
  try {
    user = await requireAuth(request);
    
    // Get employee data
    employee = await employeeService.getEmployeeByUserId(user.userId);
    
    if (!employee) {
      return errorResponse('Data karyawan tidak ditemukan');
    }
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = checkOutSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);
    
    const attendance = await attendanceService.checkOut({
      employeeId: employee.id,
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      accuracy: validation.data.accuracy,
      selfie: validation.data.selfie,
      deviceInfo: validation.data.deviceInfo,
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
    return errorResponse(error.message || 'Check-out gagal');
  }
}
