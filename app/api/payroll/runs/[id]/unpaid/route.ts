import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications/dispatch';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'pay');
    const { id } = await params;
    const before = await payrollService.getPayrollRunById(id);
    const run = await payrollService.markPayrollRunUnpaid(id);
    await logAudit(user.userId, 'MARK_UNPAID', 'PayrollRun', id, before, run, request);
    await Promise.all(before.items.map(({ employee }) => notifyUser({
      employeeId: employee.id,
      title: 'Pembayaran Payroll Dibatalkan',
      message: `Status pembayaran payroll periode ${before.period} dibatalkan / diubah menjadi Belum Dibayar.`,
      type: 'PAYROLL_UNPAID',
    })));
    return successResponse(run, 'Payroll berhasil ditandai unpaid');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal menandai payroll unpaid', 500);
  }
}
