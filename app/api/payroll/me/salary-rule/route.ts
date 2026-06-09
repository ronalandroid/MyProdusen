import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { tbmPayrollService } from '@/src/services/payroll/tbm-payroll.service';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await tbmPayrollService.getEmployeeOwnSalary(user.userId));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
