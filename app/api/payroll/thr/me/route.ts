import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { successResponse, forbiddenResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { employeeService } from '@/services/employees/employee.service';
import { getThrForEmployee } from '@/src/services/payroll/thr.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'readOwn');

    const employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) return errorResponse('Profil karyawan tidak ditemukan', 404);

    const year = Number(new URL(request.url).searchParams.get('year')) || new Date().getFullYear();
    return successResponse(await getThrForEmployee(employee.id, year));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
