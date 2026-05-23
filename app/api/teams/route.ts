import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    return successResponse(await leaderService.listTeams());
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal mengambil tim', error.status || 400);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    const team = await leaderService.createTeam(user.userId, await request.json());
    await logAudit(user.userId, 'CREATE', 'Team', team.id, undefined, team, request);
    return successResponse(team, 'Tim berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal membuat tim', error.status || 400);
  }
}
