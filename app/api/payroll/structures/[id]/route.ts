import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

const updateStructureSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  baseSalary: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const { id } = await params;
    return successResponse(await payrollService.getStructureById(id));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}

export const PATCH = withApiHandler<{ id: string }>(async (request, { params }) => {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');
    const { id } = await params;
    const body = await getRequestBody(request);
    const validation = updateStructureSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);
    const oldStructure = await payrollService.getStructureById(id);
    const structure = await payrollService.updateStructure(id, validation.data);
    await logAudit(user.userId, 'UPDATE', 'PayrollStructure', id, oldStructure, structure, request);
    return successResponse(structure, 'Struktur payroll berhasil diubah');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
});

export const DELETE = withApiHandler<{ id: string }>(async (request, { params }) => {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');
    const { id } = await params;
    const oldStructure = await payrollService.getStructureById(id);
    const result = await payrollService.deleteStructure(id);
    await logAudit(user.userId, 'DELETE', 'PayrollStructure', id, oldStructure, undefined, request);
    return successResponse(result, 'Struktur payroll berhasil dihapus');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
});
