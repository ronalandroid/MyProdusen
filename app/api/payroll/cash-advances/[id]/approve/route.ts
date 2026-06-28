import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, notFoundResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications/dispatch';
import { approveAdvance } from '@/src/services/payroll/cash-advance.service';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'PAYROLL_MUTATE')) return forbiddenResponse('Anda tidak memiliki akses');

    const { id } = await params;
    const advance = await approveAdvance(id, user.userId);
    if (!advance) return notFoundResponse('Kasbon tidak ditemukan');

    await logAudit(user.userId, 'APPROVE_CASH_ADVANCE', 'CashAdvance', id, undefined, {
      amount: advance.amount, monthlyDeduction: advance.monthlyDeduction, installments: advance.installments,
    }, request);

    // Realtime notification to the employee (emits notification.created).
    await notifyUser({
      employeeId: advance.employeeId,
      title: 'Kasbon Disetujui',
      message: `Kasbon Rp ${advance.amount.toLocaleString('id-ID')} disetujui. Potongan Rp ${advance.monthlyDeduction.toLocaleString('id-ID')}/bulan selama ${advance.installments} bulan.`,
      type: 'CASH_ADVANCE_APPROVED',
    });

    return successResponse(advance, 'Kasbon disetujui');
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
