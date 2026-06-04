import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const result = await kpiService.getResultById(id);

    // BOLA guard: self-service roles may only read their own KPI result.
    // SUPERADMIN (KPI_READ) may read any.
    if (!hasPermission(user.role, 'KPI_READ')) {
      const ownerUserId = result.employee?.userId;
      if (!ownerUserId || ownerUserId !== user.userId) {
        return forbiddenResponse('Anda tidak memiliki akses');
      }
    }

    return successResponse(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil hasil KPI');
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'KPI_INPUT')) {
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
