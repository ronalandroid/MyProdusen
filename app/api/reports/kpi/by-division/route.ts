import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { hasPermission } from '@/lib/permissions';
import { handleApiError } from '@/lib/core/route-handler';
import { getKpiProductionByDivision } from '@/services/kpi/kpi-by-division';

/**
 * KPI production rolled up per division for a month (YYYY-MM). SUPERADMIN-only
 * (KPI_READ) — it's an all-divisions aggregate, not scoped to one team/leader.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'KPI_READ')) {
      return forbiddenResponse('Anda tidak memiliki akses melihat KPI per divisi');
    }
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const rows = await getKpiProductionByDivision(period);
    return successResponse({ period, rows });
  } catch (error: any) {
    if (error?.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
