import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/core/route-handler';

const createRunSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
  periodStart: z.string().transform((value) => new Date(value)),
  periodEnd: z.string().transform((value) => new Date(value)),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const runs = await payrollService.getPayrollRuns();
    return successResponse(runs);
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
    const validation = createRunSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const run = await payrollService.createPayrollRun({ ...validation.data, calculatedBy: user.userId });
    await logAudit(user.userId, 'CREATE', 'PayrollRun', run.id, undefined, run, request);
    return successResponse(run, 'Payroll run berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}
