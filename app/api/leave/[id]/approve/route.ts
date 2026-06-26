import { NextRequest } from 'next/server';
import { leaveService } from '@/services/leave/leave.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

async function canApproveLeave(user: Awaited<ReturnType<typeof requireAuth>>, employeeId: string) {
  if (user.role === 'SUPERADMIN') {
    return true;
  }

  const supervisor = await employeeService.getEmployeeByUserId(user.userId);
  const targetEmployee = await employeeService.getEmployeeById(employeeId);
  return !!supervisor && targetEmployee.supervisorId === supervisor.id;
}

export const POST = withApiHandler<{ id: string }>(async (
  request,
  context,
) => {
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

    // Get override reason from request body if provided
    const body = await request.json().catch(() => ({}));
    const overrideReason = body.overrideReason;

    // Check if the leave dates are in a locked period
    try {
      await payrollPeriodService.assertDateEditable(
        existingLeaveRequest.startDate,
        overrideReason,
        user.role === 'SUPERADMIN'
      );
      
      await payrollPeriodService.assertDateEditable(
        existingLeaveRequest.endDate,
        overrideReason,
        user.role === 'SUPERADMIN'
      );
    } catch (error: any) {
      return errorResponse(error.message, 403);
    }

    const leaveRequest = await leaveService.approveLeaveRequest(id, user.userId);
    
    await logAudit(
      user.userId, 
      'APPROVE', 
      'LeaveRequest', 
      id, 
      existingLeaveRequest, 
      {
        ...leaveRequest,
        overrideReason: overrideReason || null,
      }, 
      request
    );
    
    return successResponse(leaveRequest, 'Pengajuan berhasil disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return handleApiError(error);
  }
});
