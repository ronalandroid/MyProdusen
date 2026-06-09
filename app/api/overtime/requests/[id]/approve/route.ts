import { NextRequest } from 'next/server';
import { overtimeService } from '@/src/services/overtime/overtime.service';
import { getCurrentUser } from '@/lib/auth-context';
import { logAudit } from '@/lib/audit';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'SUPERADMIN' ) {
      return forbiddenResponse();
    }

    const overtimeRequest = await overtimeService.approveRequest(params.id, user.id);
    await logAudit(user.id, 'APPROVE', 'OvertimeRequest', params.id, undefined, overtimeRequest, request);

    return successResponse(overtimeRequest);
  } catch (error: any) {
    console.error('Approve overtime error:', error);
    return handleApiError(error);
  }
}
