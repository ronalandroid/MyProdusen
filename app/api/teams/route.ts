import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

const createTeamSchema = z.object({
  name: z.string().min(1, 'Nama tim wajib diisi').max(120, 'Nama tim terlalu panjang'),
  type: z.string().max(60).optional(),
  description: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    return successResponse(await leaderService.listTeams());
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    const validated = createTeamSchema.parse(await request.json());
    const team = await leaderService.createTeam(user.userId, validated);
    await logAudit(user.userId, 'CREATE', 'Team', team.id, undefined, team, request);
    return successResponse(team, 'Tim berhasil dibuat', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.name === 'ZodError') return validationErrorResponse(error.errors?.[0]?.message || 'Data tim tidak valid');
    return handleApiError(error);
  }
}
