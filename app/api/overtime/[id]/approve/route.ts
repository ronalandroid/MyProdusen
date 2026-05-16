import { NextRequest } from 'next/server';
import { overtimeService } from '@/features/overtime/overtime.service';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    
    if (!hasPermission(user.role, 'ATTENDANCE_APPROVE') && user.role !== 'SUPERVISOR') {
      return forbiddenResponse('You do not have permission to approve overtime requests');
    }

    const oldRequest = await overtimeService.getRequestById(id);
    const approved = await overtimeService.approveRequest(id, user.userId);

    await logAudit(user.userId, 'APPROVE', 'OvertimeRequest', id, oldRequest, approved, request);

    return successResponse(approved, 'Overtime request approved successfully');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return errorResponse(error.message || 'Failed to approve overtime request');
  }
}
