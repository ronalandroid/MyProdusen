import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { notifyUser } from '@/lib/notifications/dispatch';
import { handleApiError } from '@/lib/core/route-handler';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'pay');
    const { id } = await params;
    const before = await payrollService.getPayrollRunById(id);
    const run = await payrollService.markPayrollRunPaid(id);
    await logAudit(user.userId, 'MARK_PAID', 'PayrollRun', id, before, run, request);
    await Promise.all(before.items.map(({ employee }) => notifyUser({
      employeeId: employee.id,
      title: 'Payroll Dibayar',
      message: `Payroll periode ${before.period} sudah ditandai dibayar.`,
      type: 'PAYROLL_PAID',
    })));
    return successResponse(run, 'Payroll berhasil ditandai paid');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
