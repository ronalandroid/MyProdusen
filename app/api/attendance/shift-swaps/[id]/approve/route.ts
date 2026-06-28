import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications/dispatch';
import { approveSwap } from '@/src/services/attendance/shift-swap.service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST')) return forbiddenResponse('Anda tidak memiliki akses');

    const { id } = await params;
    const swap = await approveSwap(id, user.userId);
    if (!swap) return notFoundResponse('Permintaan tukar shift tidak ditemukan');

    await logAudit(user.userId, 'APPROVE_SHIFT_SWAP', 'ShiftSwapRequest', id, undefined, {
      requesterId: swap.requesterId, targetId: swap.targetId,
    }, request);

    await Promise.all([swap.requesterId, swap.targetId].map((employeeId) => notifyUser({
      employeeId,
      title: 'Tukar Shift Disetujui',
      message: 'Permintaan tukar shift telah disetujui. Jadwal Anda sudah diperbarui.',
      type: 'SHIFT_SWAP_APPROVED',
    })));

    return successResponse(swap, 'Tukar shift disetujui, jadwal diperbarui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
