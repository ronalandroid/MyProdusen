import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');
    const params = new URL(request.url).searchParams;
    return successResponse(await leaderService.listProductionEntriesForLeader(user.userId, params.get('teamId') || undefined, params.get('date') || undefined));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');
    const body = await request.json();
    const rows = Array.isArray(body) ? body : Array.isArray(body.entries) ? body.entries : [body];
    const results = [];
    for (const row of rows) {
      results.push(await leaderService.createOrUpdateProductionEntry(user.userId, row));
    }
    await logAudit(user.userId, 'KPI_PRODUCTION_ENTRY_UPSERT', 'KpiProductionEntry', undefined, undefined, { count: results.length, results }, request);
    return successResponse(results, 'KPI tim berhasil disimpan');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
