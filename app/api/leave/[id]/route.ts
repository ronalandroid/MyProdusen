import { NextRequest } from 'next/server';
import { leaveService } from '@/features/leave/leave.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/features/employees/employee.service';

async function canAccessLeave(user: Awaited<ReturnType<typeof requireAuth>>, employeeId: string) {
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN_HR') {
    return true;
  }

  const currentEmployee = await employeeService.getEmployeeByUserId(user.userId);

  if (user.role === 'SUPERVISOR') {
    const targetEmployee = await employeeService.getEmployeeById(employeeId);
    return targetEmployee.supervisorId === currentEmployee.id || targetEmployee.id === currentEmployee.id;
  }

  return currentEmployee.id === employeeId;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_READ') && !hasPermission(user.role, 'LEAVE_READ_OWN')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat pengajuan');
    }
    
    const leaveRequest = await leaveService.getLeaveRequestById((await context.params).id);

    if (!(await canAccessLeave(user, leaveRequest.employeeId))) {
      return forbiddenResponse('Anda tidak memiliki akses untuk melihat pengajuan ini');
    }
    
    return successResponse(leaveRequest);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal mengambil data pengajuan');
  }
}
