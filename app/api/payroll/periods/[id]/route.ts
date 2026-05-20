import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollPeriodService } from '@/features/payroll/payroll-period.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

const updatePeriodSchema = z.object({
  name: z.string().min(3).optional(),
  startDate: z.string().transform(str => new Date(str)).optional(),
  endDate: z.string().transform(str => new Date(str)).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'PAYROLL_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses payroll');
    }

    const period = await payrollPeriodService.getPeriodById(id);

    return successResponse(period);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to fetch payroll period');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'PAYROLL_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses payroll');
    }

    const body = await getRequestBody(request);
    const validation = updatePeriodSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const oldPeriod = await payrollPeriodService.getPeriodById(id);
    const updated = await payrollPeriodService.updatePeriod(id, validation.data);

    await logAudit(user.userId, 'UPDATE', 'PayrollPeriod', id, oldPeriod, updated, request);

    return successResponse(updated, 'Payroll period updated successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to update payroll period');
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'PAYROLL_MUTATE')) {
      return forbiddenResponse('Anda tidak memiliki akses payroll');
    }

    const period = await payrollPeriodService.deletePeriod(id);

    await logAudit(user.userId, 'DELETE', 'PayrollPeriod', id, period, undefined, request);

    return successResponse(period, 'Payroll period deleted successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to delete payroll period');
  }
}
