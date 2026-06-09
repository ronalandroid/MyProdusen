import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return successResponse(await leaderService.getOwnProductionEntries(user.userId));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
