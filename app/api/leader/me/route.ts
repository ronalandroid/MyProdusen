import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');
    const [employee, teams] = await Promise.all([leaderService.getLeaderEmployeeProfile(user.userId), leaderService.getLeaderTeams(user.userId)]);
    return successResponse({ employee, teams, teamAssigned: teams.length > 0 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil profil Leader', error.status || 400);
  }
}
