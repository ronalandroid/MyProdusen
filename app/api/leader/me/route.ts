import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { handleApiError } from '@/lib/core/route-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');
    const [employee, teams] = await Promise.all([leaderService.getLeaderEmployeeProfile(user.userId), leaderService.getLeaderTeams(user.userId)]);
    return successResponse({ employee, teams, teamAssigned: teams.length > 0 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
