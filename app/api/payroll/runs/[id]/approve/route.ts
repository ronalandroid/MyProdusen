import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse();
    }

    const run = await payrollService.approvePayrollRun(params.id, user.id);

    return successResponse(run);
  } catch (error: any) {
    console.error('Approve payroll error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
