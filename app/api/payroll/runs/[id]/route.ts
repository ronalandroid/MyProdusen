import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const run = await payrollService.getPayrollRunById(params.id);

    return successResponse(run);
  } catch (error: any) {
    console.error('Get payroll run error:', error);
    return errorResponse(error.message || 'Internal server error', error.message.includes('tidak ditemukan') ? 404 : 500);
  }
}
