import { NextRequest, NextResponse } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/core/route-handler';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'export');

    const rl = await rateLimit(request, RATE_LIMITS.API_STRICT, 'payroll:export');
    if (rl.limited) {
      return errorResponse('Terlalu banyak permintaan ekspor payroll. Coba lagi sebentar.', 429);
    }

    const { id } = await params;
    const run = await payrollService.getPayrollRunById(id);
    const rows = [
      ['NIP', 'Nama', 'Divisi', 'Posisi', 'Gaji Pokok', 'Tunjangan', 'Lembur', 'Gross Pay', 'Potongan', 'Net Pay'],
      ...run.items.map(({ item, employee }) => [
        employee.nip,
        employee.fullName,
        employee.division ?? '',
        employee.position ?? '',
        item.baseSalary,
        item.totalAllowances,
        item.overtimePay,
        item.grossPay,
        item.totalDeductions,
        item.netPay,
      ]),
    ];
    await logAudit(user.userId, 'EXPORT', 'PayrollRun', id, undefined, { period: run.period, rows: run.items.length }, request);
    return new NextResponse(rows.map((row) => row.map(csvEscape).join(',')).join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payroll-${run.period}.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
