import { NextRequest } from 'next/server';
import { attendanceService } from '@/features/attendance/attendance.service';
import { checkInSchema } from '@/lib/validations/attendance';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/features/employees/employee.service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Get employee data
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    
    const body = await getRequestBody(request);
    
    // Validate input
    const validation = checkInSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);
    
    const attendance = await attendanceService.checkIn({
      employeeId: employee.id,
      workLocationId: validation.data.workLocationId,
      shiftId: validation.data.shiftId,
      latitude: validation.data.latitude,
      longitude: validation.data.longitude,
      accuracy: validation.data.accuracy,
      selfie: validation.data.selfie,
      deviceInfo: validation.data.deviceInfo,
      ipAddress,
      userAgent,
    });
    
    return successResponse(attendance, 'Check-in berhasil');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Check-in gagal');
  }
}
