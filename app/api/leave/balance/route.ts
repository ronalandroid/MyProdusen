import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { employeeService } from '@/services/employees/employee.service';
import { leaveBalanceService } from '@/features/leave/leave-balance.service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const year = Number(searchParams.get('year') || new Date().getFullYear());
    const employee = await employeeService.getEmployeeByUserId(user.userId);
    const balance = await leaveBalanceService.getBalance(employee.id, year);

    return successResponse(balance);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil saldo cuti');
  }
}
