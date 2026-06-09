import { NextRequest } from 'next/server';
import { z } from 'zod';
import { overtimeService } from '@/features/overtime/overtime.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';

const rejectSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'ATTENDANCE_APPROVE') ) {
      return forbiddenResponse('You do not have permission to reject overtime requests');
    }

    const body = await getRequestBody(request);
    const validation = rejectSchema.safeParse(body);
    
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }

    const oldRequest = await overtimeService.getRequestById(id);
    const rejected = await overtimeService.rejectRequest(id, user.userId, validation.data.rejectionReason);

    await logAudit(user.userId, 'REJECT', 'OvertimeRequest', id, oldRequest, rejected, request);

    return successResponse(rejected, 'Overtime request rejected successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
