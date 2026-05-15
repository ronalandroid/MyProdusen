import { NextRequest } from 'next/server';
import { attendanceService } from '@/services/attendance/attendance.service';
import { employeeService } from '@/services/employees/employee.service';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, successResponse, unauthorizedResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const attendance = await attendanceService.getTodayAttendance(employee.id);

    return successResponse(attendance);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }

    return errorResponse(error.message || 'Gagal mengambil absensi hari ini');
  }
}
