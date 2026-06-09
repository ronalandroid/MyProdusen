import { NextRequest } from 'next/server';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { tbmPayrollService } from '@/src/services/payroll/tbm-payroll.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengelola aturan gaji.');
    return successResponse(await tbmPayrollService.listPayrollRules());
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengelola aturan gaji.');
    const body = await getRequestBody(request) as any;
    const row = await tbmPayrollService.upsertPayrollRule(user.userId, body);
    await logAudit(user.userId, body.id ? 'PAYROLL_RULE_UPDATE' : 'PAYROLL_RULE_CREATE', 'PayrollRule', row.id, undefined, row, request);
    return successResponse(row, 'Aturan gaji berhasil disimpan', body.id ? 200 : 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export const PATCH = POST;
