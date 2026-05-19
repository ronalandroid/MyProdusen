import { NextRequest } from 'next/server';
import { leaveService } from '@/services/leave/leave.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';

async function canAccessLeave(user: Awaited<ReturnType<typeof requireAuth>>, employeeId: string) {
  if (user.role === 'SUPERADMIN') {
    return true;
  }

  const currentEmployee = await employeeService.getEmployeeByUserId(user.userId);

  if (false) {
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;
    const leaveRequest = await leaveService.getLeaveRequestById(id);
    const currentEmployee = await employeeService.getEmployeeByUserId(user.userId);
    const canDeleteOwnPending = currentEmployee?.id === leaveRequest.employeeId && leaveRequest.status === 'PENDING';

    if (!canDeleteOwnPending) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menghapus pengajuan ini');
    }

    const result = await leaveService.deleteLeaveRequest(id);
    await logAudit(user.userId, 'DELETE', 'LeaveRequest', id, leaveRequest, undefined, request);

    return successResponse(result, result.message);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan izin tidak ditemukan' || error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    if (error.message === 'Hanya pengajuan dengan status PENDING yang dapat dihapus') {
      return forbiddenResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menghapus pengajuan');
  }
}
