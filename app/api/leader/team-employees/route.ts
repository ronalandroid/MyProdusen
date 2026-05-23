import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'LEADER') return forbiddenResponse('Anda tidak memiliki akses Leader');
    const teamId = new URL(request.url).searchParams.get('teamId') || undefined;
    return successResponse(await leaderService.getTeamEmployeesForLeader(user.userId, teamId));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil anggota tim', error.status || 400);
  }
}
