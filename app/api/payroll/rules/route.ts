import { NextRequest } from 'next/server';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';

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
    return errorResponse(error.message || 'Gagal mengambil aturan payroll');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') {
      return forbiddenResponse('Hanya Superadmin yang dapat menambahkan aturan payroll');
    }
    const body = await request.json();
    const {
      employeeId,
      teamId,
      divisionId,
      periodType,
      baseSalary,
      targetMetricId,
      targetQuantity,
      bonusType,
      bonusAmountPerUnit,
      attendancePolicyId,
      holidayMultiplierEnabled,
      realtimeCalculationEnabled,
      effectiveFrom,
      effectiveTo,
    } = body;

    if (!baseSalary) return errorResponse('Gaji pokok wajib diisi', 422);

    const rule = await payrollService.createPayrollRule(user.userId, {
      employeeId: employeeId || null,
      teamId: teamId || null,
      divisionId: divisionId || null,
      periodType,
      baseSalary: Number(baseSalary),
      targetMetricId: targetMetricId || null,
      targetQuantity: targetQuantity !== undefined && targetQuantity !== null ? Number(targetQuantity) : null,
      bonusType,
      bonusAmountPerUnit: bonusAmountPerUnit !== undefined && bonusAmountPerUnit !== null ? Number(bonusAmountPerUnit) : null,
      attendancePolicyId: attendancePolicyId || null,
      holidayMultiplierEnabled: holidayMultiplierEnabled !== undefined ? Boolean(holidayMultiplierEnabled) : true,
      realtimeCalculationEnabled: realtimeCalculationEnabled !== undefined ? Boolean(realtimeCalculationEnabled) : true,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
    });

    return successResponse(rule, 'Aturan payroll berhasil ditambahkan', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menambahkan aturan payroll');
  }
}

export async function PUT(request: NextRequest) {
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
    return errorResponse(error.message || 'Gagal memperbarui aturan payroll');
  }
}
