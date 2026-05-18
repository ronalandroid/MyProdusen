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
    assertPayrollAccess(user.role, 'approve');
    const { id } = await params;
    const before = await payrollService.getPayrollRunById(id);
    const run = await payrollService.approvePayrollRun(id, user.userId);
    await logAudit(user.userId, 'APPROVE', 'PayrollRun', id, before, run, request);
    await Promise.all(before.items.map(({ employee }) => notifyUser({
      employeeId: employee.id,
      title: 'Payroll Disetujui',
      message: `Payroll periode ${before.period} sudah disetujui.`,
      type: 'PAYROLL_APPROVED',
    })));
    return successResponse(run, 'Payroll berhasil disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal approve payroll', 500);
  }
}
