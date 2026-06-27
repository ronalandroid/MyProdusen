import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

// Strict validation so malformed numbers can't become NaN in salary columns.
const createRuleSchema = z.object({
  employeeId: z.string().min(1).nullish(),
  teamId: z.string().min(1).nullish(),
  divisionId: z.string().min(1).nullish(),
  periodType: z.enum(['MONTHLY', 'WEEKLY']),
  baseSalary: z.coerce.number().finite().nonnegative('Gaji pokok harus angka >= 0'),
  targetMetricId: z.string().min(1).nullish(),
  targetQuantity: z.coerce.number().finite().nonnegative().nullish(),
  bonusType: z.enum(['PER_EXTRA_UNIT', 'FIXED', 'PERCENTAGE']).optional(),
  bonusAmountPerUnit: z.coerce.number().finite().nonnegative().nullish(),
  attendancePolicyId: z.string().min(1).nullish(),
  holidayMultiplierEnabled: z.boolean().optional(),
  realtimeCalculationEnabled: z.boolean().optional(),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat melihat aturan payroll');
    }
    const { searchParams } = new URL(request.url);
    const rules = await payrollService.getPayrollRules({
      active: searchParams.get('active') !== 'false',
      employeeId: searchParams.get('employeeId') || undefined,
      teamId: searchParams.get('teamId') || undefined,
    });
    return successResponse(rules);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export const POST = withApiHandler(async (request) => {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat menambahkan aturan payroll');
    }
    const parsed = createRuleSchema.safeParse(await request.json());
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Data aturan payroll tidak valid');
    const v = parsed.data;

    const rule = await payrollService.createPayrollRule(user.userId, {
      employeeId: v.employeeId || null,
      teamId: v.teamId || null,
      divisionId: v.divisionId || null,
      periodType: v.periodType,
      baseSalary: v.baseSalary,
      targetMetricId: v.targetMetricId || null,
      targetQuantity: v.targetQuantity ?? null,
      bonusType: v.bonusType,
      bonusAmountPerUnit: v.bonusAmountPerUnit ?? null,
      attendancePolicyId: v.attendancePolicyId || null,
      holidayMultiplierEnabled: v.holidayMultiplierEnabled !== undefined ? v.holidayMultiplierEnabled : true,
      realtimeCalculationEnabled: v.realtimeCalculationEnabled !== undefined ? v.realtimeCalculationEnabled : true,
      effectiveFrom: v.effectiveFrom ? new Date(v.effectiveFrom) : null,
      effectiveTo: v.effectiveTo ? new Date(v.effectiveTo) : null,
    });

    return successResponse(rule, 'Aturan payroll berhasil ditambahkan', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
});

export const PUT = withApiHandler(async (request) => {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat memperbarui aturan payroll');
    }
    const body = await request.json();
    const {
      id,
      baseSalary,
      divisionId,
      targetMetricId,
      targetQuantity,
      bonusType,
      bonusAmountPerUnit,
      attendancePolicyId,
      holidayMultiplierEnabled,
      realtimeCalculationEnabled,
      active,
      effectiveFrom,
      effectiveTo,
    } = body;

    if (!id) return errorResponse('ID aturan payroll wajib diisi', 422);

    const rule = await payrollService.updatePayrollRule(user.userId, id, {
      baseSalary: baseSalary !== undefined ? Number(baseSalary) : undefined,
      divisionId: divisionId !== undefined ? divisionId : undefined,
      targetMetricId: targetMetricId !== undefined ? targetMetricId : undefined,
      targetQuantity: targetQuantity !== undefined && targetQuantity !== null ? Number(targetQuantity) : null,
      bonusType,
      bonusAmountPerUnit: bonusAmountPerUnit !== undefined && bonusAmountPerUnit !== null ? Number(bonusAmountPerUnit) : null,
      attendancePolicyId: attendancePolicyId !== undefined ? attendancePolicyId : undefined,
      holidayMultiplierEnabled: holidayMultiplierEnabled !== undefined ? Boolean(holidayMultiplierEnabled) : undefined,
      realtimeCalculationEnabled: realtimeCalculationEnabled !== undefined ? Boolean(realtimeCalculationEnabled) : undefined,
      active,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
    });

    return successResponse(rule, 'Aturan payroll berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
});
