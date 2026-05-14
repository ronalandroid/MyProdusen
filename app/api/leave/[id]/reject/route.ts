import { NextRequest } from 'next/server';
import { leaveService } from '@/features/leave/leave.service';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { getRequestBody, requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { z } from 'zod';

const rejectLeaveSchema = z.object({
  reason: z.string().min(10, 'Alasan penolakan minimal 10 karakter'),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_REJECT')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menolak pengajuan');
    }
    
    const body = await getRequestBody(request);
    
    const validation = rejectLeaveSchema.safeParse(body);
    if (!validation.success) {
      return validationErrorResponse(validation.error.errors[0].message);
    }
    
    const leaveRequest = await leaveService.rejectLeaveRequest(
      (await context.params).id,
      user.userId,
      validation.data.reason
    );
    
    return successResponse(leaveRequest, 'Pengajuan berhasil ditolak');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menolak pengajuan');
  }
}
