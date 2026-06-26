import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

export const POST = withApiHandler<{ id: string }>(async (request, { params }) => {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');
    const { id } = await params;
    const before = await payrollService.getPayrollRunById(id);
    const run = await payrollService.calculatePayroll(id);
    await logAudit(user.userId, 'CALCULATE', 'PayrollRun', id, before, run, request);
    return successResponse(run, 'Payroll berhasil dikalkulasi');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
});
