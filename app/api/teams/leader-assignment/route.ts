import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    const body = await request.json();
    const assignment = await leaderService.assignLeader(user.userId, body.leaderUserId, body.teamId);
    await logAudit(user.userId, 'LEADER_ASSIGNED_TO_TEAM', 'LeaderAssignment', assignment.id, undefined, assignment, request);
    return successResponse(assignment, 'Leader berhasil ditetapkan ke tim');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menetapkan Leader', error.status || 400);
  }
}
