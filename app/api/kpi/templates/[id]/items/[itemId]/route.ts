import { NextRequest } from 'next/server';
import { kpiService } from '@/services/kpi/kpi.service';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, forbiddenResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';

export const PATCH = withApiHandler<{ id: string; itemId: string }>(async (
  request,
  { params },
) => {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'KPI_TEMPLATE_UPDATE')) return forbiddenResponse('Anda tidak memiliki akses');
    const { itemId } = await params;
    const body = await request.json();
    const updated = await kpiService.updateItem(itemId, {
      weight: body.weight != null ? Number(body.weight) : undefined,
      targetValue: body.targetValue != null ? Number(body.targetValue) : undefined,
      unit: body.unit ?? undefined,
    });
    await logAudit(user.userId, 'UPDATE', 'KpiItem', itemId, null, updated, request);
    return successResponse(updated, 'Item KPI berhasil diperbarui');
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
});
