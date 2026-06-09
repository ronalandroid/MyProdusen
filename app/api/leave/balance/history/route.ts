import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year') || new Date().getFullYear());
    
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const history = await leaveBalanceService.getBalanceHistory(employee.id, year);

    return successResponse(history);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
