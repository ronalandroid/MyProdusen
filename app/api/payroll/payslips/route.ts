import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { employeeService } from '@/services/employees/employee.service';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || '10'), 50);

    let employeeId = searchParams.get('employeeId') || undefined;

    if (user.role === 'EMPLOYEE' || user.role === 'LEADER') {
      const emp = await employeeService.getEmployeeByUserId(user.userId);
      if (!emp) return forbiddenResponse('Profil karyawan tidak ditemukan');
      employeeId = emp.id;
    } else if (!hasPermission(user.role, 'PAYROLL_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }

    if (!employeeId) return forbiddenResponse('employeeId diperlukan');

    const rows = await payrollService.getEmployeePayrollItems(employeeId);
    const limited = rows.slice(0, limit).map(({ item, run }) => ({
      id: item.id,
      period: run.period,
      netPay: item.netPay,
      status: run.status,
      runId: run.id,
    }));

    return successResponse(limited);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
