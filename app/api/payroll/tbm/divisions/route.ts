import { NextRequest } from 'next/server';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { tbmPayrollService } from '@/src/services/payroll/tbm-payroll.service';
import { logAudit } from '@/lib/audit';

function requireSuperadmin(role: string) {
  return role === 'SUPERADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!requireSuperadmin(user.role)) return forbiddenResponse('Hanya Superadmin yang dapat mengelola divisi.');
    return successResponse(await tbmPayrollService.listDivisions());
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil divisi', error.status || 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!requireSuperadmin(user.role)) return forbiddenResponse('Hanya Superadmin yang dapat mengelola divisi.');
    const body = await getRequestBody(request) as any;
    const row = await tbmPayrollService.upsertDivision(body);
    await logAudit(user.userId, body.id ? 'DIVISION_UPDATE' : 'DIVISION_CREATE', 'Division', row.id, undefined, row, request);
    return successResponse(row, 'Divisi berhasil disimpan', body.id ? 200 : 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menyimpan divisi', error.status || 500);
  }
}

export const PATCH = POST;
