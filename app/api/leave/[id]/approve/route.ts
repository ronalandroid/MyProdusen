import { NextRequest } from 'next/server';
import { leaveService } from '@/features/leave/leave.service';
import { successResponse, errorResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/response';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    
    if (!hasPermission(user.role, 'LEAVE_APPROVE')) {
      return forbiddenResponse('Anda tidak memiliki akses untuk menyetujui pengajuan');
    }
    
    const leaveRequest = await leaveService.approveLeaveRequest((await context.params).id, user.userId);
    
    return successResponse(leaveRequest, 'Pengajuan berhasil disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return unauthorizedResponse();
    }
    if (error.message === 'Pengajuan tidak ditemukan') {
      return notFoundResponse(error.message);
    }
    return errorResponse(error.message || 'Gagal menyetujui pengajuan');
  }
}
