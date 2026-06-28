import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications/dispatch';
import { rejectAdvance } from '@/src/services/payroll/cash-advance.service';

const rejectSchema = z.object({ reason: z.string().min(5, 'Alasan penolakan minimal 5 karakter').max(500) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'PAYROLL_MUTATE')) return forbiddenResponse('Anda tidak memiliki akses');

    const parsed = rejectSchema.safeParse(await getRequestBody(request));
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Alasan tidak valid');

    const { id } = await params;
    const advance = await rejectAdvance(id, user.userId, parsed.data.reason);
    if (!advance) return notFoundResponse('Kasbon tidak ditemukan');

    await logAudit(user.userId, 'REJECT_CASH_ADVANCE', 'CashAdvance', id, undefined, { reason: parsed.data.reason }, request);
    await notifyUser({
      employeeId: advance.employeeId,
      title: 'Kasbon Ditolak',
      message: `Pengajuan kasbon Anda ditolak: ${parsed.data.reason}`,
      type: 'CASH_ADVANCE_REJECTED',
    });

    return successResponse(advance, 'Kasbon ditolak');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
