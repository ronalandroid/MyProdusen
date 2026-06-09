import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/core/route-handler';

const lockSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'PAYROLL_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses payroll');
    }

    const body = await getRequestBody(request);
    const validation = lockSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const oldPeriod = await payrollPeriodService.getPeriodById(id);
    const locked = await payrollPeriodService.lockPeriod({
      periodId: id,
      lockedBy: user.userId,
      reason: validation.data.reason,
    });

    await logAudit(user.userId, 'LOCK', 'PayrollPeriod', id, oldPeriod, locked, request);

    return successResponse(locked, 'Payroll period locked successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
