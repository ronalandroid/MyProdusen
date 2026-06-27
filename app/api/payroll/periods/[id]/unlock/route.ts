import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

const unlockSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export const POST = withApiHandler<{ id: string }>(async (request, { params }) => {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    if (!hasPermission(user.role, 'PAYROLL_MUTATE')) {
      return forbiddenResponse('Anda tidak memiliki akses payroll');
    }

    const body = await getRequestBody(request);
    const validation = unlockSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const oldPeriod = await payrollPeriodService.getPeriodById(id);
    const unlocked = await payrollPeriodService.unlockPeriod({
      periodId: id,
      unlockedBy: user.userId,
      reason: validation.data.reason,
    });

    await logAudit(user.userId, 'UNLOCK', 'PayrollPeriod', id, oldPeriod, unlocked, request);

    return successResponse(unlocked, 'Payroll period unlocked successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
});
