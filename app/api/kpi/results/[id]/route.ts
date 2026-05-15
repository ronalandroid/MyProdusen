import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await kpiService.getResultById(id);
    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil hasil KPI');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!['SUPERADMIN', 'ADMIN_HR', 'SUPERVISOR'].includes(user.role)) {
      return forbiddenResponse('Anda tidak memiliki akses');
    }
    const { id } = await params;
    const body = await request.json();
    const oldResult = await kpiService.getResultById(id);
    const result = await kpiService.updateResult(id, {
      actualValue: body.actualValue,
      notes: body.notes,
    });
    await logAudit(user.userId, 'UPDATE', 'KpiResult', id, oldResult, result, request);
    return successResponse(result, 'Hasil KPI berhasil diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal memperbarui hasil KPI');
  }
}
