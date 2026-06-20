import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

const leaderAssignmentSchema = z.object({
  leaderUserId: z.string().min(1, 'Leader wajib dipilih'),
  teamId: z.string().min(1, 'Tim wajib dipilih'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    const body = leaderAssignmentSchema.parse(await request.json());
    const assignment = await leaderService.assignLeader(user.userId, body.leaderUserId, body.teamId);
    await logAudit(user.userId, 'LEADER_ASSIGNED_TO_TEAM', 'LeaderAssignment', assignment.id, undefined, assignment, request);
    return successResponse(assignment, 'Leader berhasil ditetapkan ke tim');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.name === 'ZodError') return validationErrorResponse(error.errors?.[0]?.message || 'Data penetapan tidak valid');
    return handleApiError(error);
  }
}
