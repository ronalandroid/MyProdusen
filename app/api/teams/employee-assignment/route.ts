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
    const assignment = await leaderService.assignEmployee(user.userId, body.employeeId, body.teamId, body.positionId || null);
    await logAudit(user.userId, 'EMPLOYEE_ASSIGNED_TO_TEAM', 'EmployeeTeamAssignment', assignment.id, undefined, assignment, request);
    return successResponse(assignment, 'Karyawan berhasil ditetapkan ke tim');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Gagal menetapkan karyawan', error.status || 400);
  }
}
