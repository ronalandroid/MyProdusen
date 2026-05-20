import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = await requireAuth(request);
    const { itemId } = await params;
    const data = await payrollService.getOrCreatePayslip(itemId);

    if (user.role === 'EMPLOYEE') {
      assertPayrollAccess(user.role, 'readOwn');
      if (user.userId !== data.employee.userId) return forbiddenResponse('Anda hanya dapat melihat payslip sendiri');
    } else {
      assertPayrollAccess(user.role, 'read');
    }

    const content = [
      'MYPRODUSEN PAYSLIP',
      `Periode: ${data.run.period}`,
      `NIP: ${data.employee.nip}`,
      `Nama: ${data.employee.fullName}`,
      `Gaji Pokok: ${formatCurrency(data.item.baseSalary)}`,
      `Tunjangan: ${formatCurrency(data.item.totalAllowances)}`,
      `Lembur: ${formatCurrency(data.item.overtimePay)}`,
      `Potongan: ${formatCurrency(data.item.totalDeductions)}`,
      `Net Pay: ${formatCurrency(data.item.netPay)}`,
    ].join('\n');

    await payrollService.markPayslipDownloaded(itemId);
    await logAudit(user.userId, 'DOWNLOAD', 'Payslip', data.payslip.id, undefined, { itemId, period: data.run.period }, request);

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="payslip-${data.employee.nip}-${data.run.period}.txt"`,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal download payslip', 500);
  }
}
