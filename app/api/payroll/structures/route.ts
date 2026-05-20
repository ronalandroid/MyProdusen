import { NextRequest } from 'next/server';
import { z } from 'zod';
import { payrollService } from '@/src/services/payroll/payroll.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { logAudit } from '@/lib/audit';
import { hasPermission } from '@/lib/permissions';

const createStructureSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  description: z.string().optional(),
  baseSalary: z.number().min(0, 'Gaji pokok harus positif'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const structures = await payrollService.getStructures(isActive === 'true' ? true : isActive === 'false' ? false : undefined);
    return successResponse(structures);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal mengambil struktur payroll', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');
    const body = await getRequestBody(request);
    const validation = createStructureSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);
    const structure = await payrollService.createStructure(validation.data);
    await logAudit(user.userId, 'CREATE', 'PayrollStructure', structure.id, undefined, structure, request);
    return successResponse(structure, 'Struktur payroll berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return errorResponse(error.message || 'Gagal membuat struktur payroll', 500);
  }
}
