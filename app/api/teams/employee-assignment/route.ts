import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { forbiddenResponse, successResponse, unauthorizedResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { leaderService } from '@/services/leader/leader.service';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

const employeeAssignmentSchema = z.object({
  employeeId: z.string().min(1, 'Karyawan wajib dipilih'),
  teamId: z.string().min(1, 'Tim wajib dipilih'),
  positionId: z.string().min(1).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'SUPERADMIN') return forbiddenResponse('Anda tidak memiliki akses');
    const body = employeeAssignmentSchema.parse(await request.json());
    const assignment = await leaderService.assignEmployee(user.userId, body.employeeId, body.teamId, body.positionId || null);
    await logAudit(user.userId, 'EMPLOYEE_ASSIGNED_TO_TEAM', 'EmployeeTeamAssignment', assignment.id, undefined, assignment, request);
    return successResponse(assignment, 'Karyawan berhasil ditetapkan ke tim');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    if (error.name === 'ZodError') return validationErrorResponse(error.errors?.[0]?.message || 'Data penetapan tidak valid');
    return handleApiError(error);
  }
}
