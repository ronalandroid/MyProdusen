import { NextRequest } from 'next/server';
import { leaveService } from '@/services/leave/leave.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { handleApiError } from '@/lib/core/route-handler';

async function canRejectLeave(user: Awaited<ReturnType<typeof requireAuth>>, employeeId: string) {
  if (user.role === 'SUPERADMIN') {
    return true;
  }

  const supervisor = await employeeService.getEmployeeByUserId(user.userId);
  const targetEmployee = await employeeService.getEmployeeById(employeeId);
  return targetEmployee.supervisorId === supervisor.id;
}

const rejectLeaveSchema = z.object({
  reason: z.string().min(10, 'Alasan penolakan minimal 10 karakter'),
  overrideReason: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_REJECT')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menolak pengajuan');
    }
    
    const body = await getRequestBody(request);
    
    const validation = rejectLeaveSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const { id } = await context.params;
    const existingLeaveRequest = await leaveService.getLeaveRequestById(id);

    if (!(await canRejectLeave(user, existingLeaveRequest.employeeId))) {
      return forbiddenResponse('Anda hanya dapat menolak pengajuan tim Anda');
    }

    // Check if the leave dates are in a locked period
    try {
      await payrollPeriodService.assertDateEditable(
        existingLeaveRequest.startDate,
        validation.data.overrideReason,
        user.role === 'SUPERADMIN'
      );
      
      await payrollPeriodService.assertDateEditable(
        existingLeaveRequest.endDate,
        validation.data.overrideReason,
        user.role === 'SUPERADMIN'
      );
    } catch (error: any) {
      return errorResponse(error.message, 403);
    }

    const leaveRequest = await leaveService.rejectLeaveRequest(
      id,
      user.userId,
      validation.data.reason
    );
    
    await logAudit(
      user.userId, 
      'REJECT', 
      'LeaveRequest', 
      id, 
      existingLeaveRequest, 
      {
        ...leaveRequest,
        overrideReason: validation.data.overrideReason || null,
      }, 
      request
    );
    
    return successResponse(leaveRequest, 'Pengajuan berhasil ditolak');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return handleApiError(error);
  }
}
