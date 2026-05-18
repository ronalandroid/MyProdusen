import { NextRequest } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' && user.role !== 'ADMIN_HR' && user.role !== 'SUPERVISOR') {
      return forbiddenResponse();
    }

    const overtimeRequest = await overtimeService.approveRequest(params.id, user.id);
    await logAudit(user.id, 'APPROVE', 'OvertimeRequest', params.id, undefined, overtimeRequest, request);

    return successResponse(overtimeRequest);
  } catch (error: any) {
    console.error('Approve overtime error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
