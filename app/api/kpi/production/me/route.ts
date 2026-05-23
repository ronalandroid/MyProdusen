import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await leaderService.getOwnProductionEntries(user.userId));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil KPI pribadi', error.status || 400);
  }
}
