import { NextRequest } from 'next/server';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { tbmPayrollService } from '@/src/services/payroll/tbm-payroll.service';
import { logAudit } from '@/lib/audit';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengelola jabatan.');
    return successResponse(await tbmPayrollService.listPositions());
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export const POST = withApiHandler(async (request) => {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Hanya Superadmin yang dapat mengelola jabatan.');
    const body = await getRequestBody(request) as any;
    const row = await tbmPayrollService.upsertPosition(body);
    await logAudit(user.userId, body.id ? 'POSITION_UPDATE' : 'POSITION_CREATE', 'Position', row.id, undefined, row, request);
    return successResponse(row, 'Jabatan berhasil disimpan', body.id ? 200 : 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
});

export const PATCH = POST;
