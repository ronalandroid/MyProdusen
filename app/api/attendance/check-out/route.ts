import { NextRequest } from 'next/server';
import { attendanceService } from '@/features/attendance/attendance.service';
import { checkOutSchema } from '@/lib/validations/attendance';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth, getClientIp, getUserAgent } from '@/lib/middleware';
import { employeeService } from '@/features/employees/employee.service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Get employee data
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    
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
    return errorResponse(error.message || 'Check-out gagal');
  }
}
