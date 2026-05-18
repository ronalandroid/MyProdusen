import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { getCurrentUser } from '@/lib/auth-context';
import { z } from 'zod';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

const createRunSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Format periode harus YYYY-MM'),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const runs = await payrollService.getPayrollRuns();

    return successResponse(runs);
  } catch (error: any) {
    console.error('Get payroll runs error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const validated = createRunSchema.parse(body);

    const run = await payrollService.createPayrollRun({
      ...validated,
      calculatedBy: user.id,
    });

    return successResponse(run, undefined, 201);
  } catch (error: any) {
    console.error('Create payroll run error:', error);
    
    if (error.name === 'ZodError') {
      return validationErrorResponse(error.errors?.[0]?.message || 'Validation error');
    }

    return errorResponse(error.message || 'Internal server error', 500);
  }
}
