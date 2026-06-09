import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'readOwn');
    const { db, employees } = await import('@/lib/db');
    const { eq } = await import('drizzle-orm');
    const [employee] = await db.select().from(employees).where(eq(employees.userId, user.userId)).limit(1);
    if (!employee) return forbiddenResponse('Profil karyawan tidak ditemukan');
    const items = await payrollService.getEmployeePayrollItems(employee.id);
    return successResponse(items);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
