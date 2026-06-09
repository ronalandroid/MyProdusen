import { NextRequest } from 'next/server';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { tbmPayrollService } from '@/src/services/payroll/tbm-payroll.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengatur penempatan payroll karyawan.');
    const body = await getRequestBody(request) as any;
    const row = await tbmPayrollService.assignEmployeePayroll(body);
    await logAudit(user.userId, 'EMPLOYEE_PAYROLL_ASSIGN', 'EmployeePayroll', row.id, undefined, row, request);
    return successResponse(row, 'Penempatan gaji karyawan berhasil disimpan', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export const PATCH = POST;
