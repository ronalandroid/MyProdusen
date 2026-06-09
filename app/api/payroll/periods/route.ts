import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { handleApiError } from '@/lib/core/route-handler';

const createPeriodSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    assertPayrollAccess(user.role, 'read');

    const periods = await payrollPeriodService.getPeriods();

    return successResponse(periods);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    assertPayrollAccess(user.role, 'mutate');

    const body = await getRequestBody(request);
    const validation = createPeriodSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const period = await payrollPeriodService.createPeriod({
      ...validation.data,
      createdBy: user.userId,
    });

    await logAudit(user.userId, 'CREATE', 'PayrollPeriod', period.id, undefined, period, request);

    return successResponse(period, 'Payroll period created successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
