import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications/dispatch';
import { rejectSwap } from '@/src/services/attendance/shift-swap.service';

const rejectSchema = z.object({ reason: z.string().min(5, 'Alasan penolakan minimal 5 karakter').max(500) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST')) return forbiddenResponse('Anda tidak memiliki akses');

    const parsed = rejectSchema.safeParse(await getRequestBody(request));
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Alasan tidak valid');

    const { id } = await params;
    const swap = await rejectSwap(id, user.userId, parsed.data.reason);
    if (!swap) return notFoundResponse('Permintaan tukar shift tidak ditemukan');

    await logAudit(user.userId, 'REJECT_SHIFT_SWAP', 'ShiftSwapRequest', id, undefined, { reason: parsed.data.reason }, request);
    await notifyUser({
      employeeId: swap.requesterId,
      title: 'Tukar Shift Ditolak',
      message: `Permintaan tukar shift Anda ditolak: ${parsed.data.reason}`,
      type: 'SHIFT_SWAP_REJECTED',
    });

    return successResponse(swap, 'Tukar shift ditolak');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
