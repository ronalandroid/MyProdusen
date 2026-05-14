import { NextRequest } from 'next/server';
import { attendanceService } from '@/features/attendance/attendance.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/features/employees/employee.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    
    let filters: any = {
      status: searchParams.get('status') as any,
      workLocationId: searchParams.get('workLocationId') || undefined,
    };
    
    // Parse dates if provided
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
    // If employee role, only show their own attendance
    if (user.role === 'EMPLOYEE') {
      const employee = await employeeService.getEmployeeByUserId(user.userId);
      filters.employeeId = employee.id;
    } else if (!hasPermission(user.role, 'ATTENDANCE_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat data absensi');
    } else {
      // For supervisor/admin, can filter by employee
      const employeeId = searchParams.get('employeeId');
      if (employeeId) {
        filters.employeeId = employeeId;
      }
    }
    
    const attendances = await attendanceService.getAttendances(filters);
    
    return successResponse(attendances);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    return errorResponse(error.message || 'Gagal mengambil data absensi');
  }
}
