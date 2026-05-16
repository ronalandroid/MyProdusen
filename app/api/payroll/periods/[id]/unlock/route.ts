import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

const unlockSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Only Superadmin can unlock payroll periods');
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
    return errorResponse(error.message || 'Failed to unlock payroll period');
  }
}
