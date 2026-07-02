import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { requestAdvance, listAdvances, type CashAdvanceStatus } from '@/src/services/payroll/cash-advance.service';

const requestSchema = z.object({
  amount: z.coerce.number().finite().positive('Jumlah kasbon harus lebih dari 0'),
  reason: z.string().min(5, 'Alasan minimal 5 karakter').max(500),
  installments: z.coerce.number().int().min(1).max(24).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'PAYROLL_MUTATE')) return forbiddenResponse('Anda tidak memiliki akses');
    const status = new URL(request.url).searchParams.get('status') as CashAdvanceStatus | null;
    return successResponse(await listAdvances(status ? { status } : undefined));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      return forbiddenResponse('Pengajuan kasbon hanya untuk Karyawan dan Leader');
    }
    // Employee lookup and body read are independent — run them in parallel.
    const [employee, rawBody] = await Promise.all([
      employeeService.getEmployeeByUserId(user.userId),
      request.json().catch(() => undefined),
    ]);
    if (!employee) return errorResponse('Profil karyawan tidak ditemukan', 404);

    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Payload kasbon tidak valid');

    const advance = await requestAdvance({
      employeeId: employee.id,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      installments: parsed.data.installments,
      requestedBy: user.userId,
    });

    await logAudit(user.userId, 'REQUEST_CASH_ADVANCE', 'CashAdvance', advance.id, undefined, { amount: advance.amount }, request);
    // Realtime: surface the pending request on admin dashboards immediately.
    await publishRealtimeEvent(createRealtimeEvent({
      type: 'dashboard.updated', scope: 'role', target: 'SUPERADMIN',
      payload: { source: 'cash-advance.requested', advanceId: advance.id, amount: advance.amount },
    }));

    return successResponse(advance, 'Pengajuan kasbon terkirim, menunggu persetujuan', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
