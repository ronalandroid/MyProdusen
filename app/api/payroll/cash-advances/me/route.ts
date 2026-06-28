import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { employeeService } from '@/services/employees/employee.service';
import { getAdvancesForEmployee } from '@/src/services/payroll/cash-advance.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    if (!employee) return errorResponse('Profil karyawan tidak ditemukan', 404);
    return successResponse(await getAdvancesForEmployee(employee.id));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
