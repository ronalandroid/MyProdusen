import { NextRequest } from 'next/server';
import { leaveService } from '@/features/leave/leave.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/features/employees/employee.service';

async function canApproveLeave(user: Awaited<ReturnType<typeof requireAuth>>, employeeId: string) {
  if (user.role === 'SUPERADMIN' || user.role === 'ADMIN_HR') {
    return true;
  }

  const supervisor = await employeeService.getEmployeeByUserId(user.userId);
  const targetEmployee = await employeeService.getEmployeeById(employeeId);
  return targetEmployee.supervisorId === supervisor.id;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_APPROVE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menyetujui pengajuan');
    }
    
    const { id } = await context.params;
    const existingLeaveRequest = await leaveService.getLeaveRequestById(id);

    if (!(await canApproveLeave(user, existingLeaveRequest.employeeId))) {
      return forbiddenResponse('Anda hanya dapat menyetujui pengajuan tim Anda');
    }

    const leaveRequest = await leaveService.approveLeaveRequest(id, user.userId);
    
    return successResponse(leaveRequest, 'Pengajuan berhasil disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menyetujui pengajuan');
  }
}
