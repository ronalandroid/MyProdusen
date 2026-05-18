import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const { id } = await params;
    const run = await payrollService.getPayrollRunById(id);
    return successResponse(run);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal mengambil detail payroll', error.message?.includes('tidak ditemukan') ? 404 : 500);
  }
}
