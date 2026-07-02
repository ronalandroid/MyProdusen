import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, errorResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError } from '@/lib/core/route-handler';
import { employeeService } from '@/services/employees/employee.service';
import { logAudit } from '@/lib/audit';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { notifyUser } from '@/lib/notifications/dispatch';
import { requestSwap, listSwaps, type ShiftSwapStatus } from '@/src/services/attendance/shift-swap.service';

const isDate = (v: string) => !Number.isNaN(Date.parse(v));
const requestSchema = z.object({
  targetEmployeeId: z.string().min(1, 'Karyawan tujuan wajib diisi'),
  requesterDate: z.string().refine(isDate, 'Tanggal shift Anda tidak valid'),
  targetDate: z.string().refine(isDate, 'Tanggal shift tujuan tidak valid'),
  reason: z.string().min(5, 'Alasan minimal 5 karakter').max(500),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST')) return forbiddenResponse('Anda tidak memiliki akses');
    const status = new URL(request.url).searchParams.get('status') as ShiftSwapStatus | null;
    return successResponse(await listSwaps(status ? { status } : undefined));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'EMPLOYEE' && user.role !== 'LEADER') {
      return forbiddenResponse('Pengajuan tukar shift hanya untuk Karyawan dan Leader');
    }
    // Employee lookup and body read are independent — run them in parallel.
    const [employee, rawBody] = await Promise.all([
      employeeService.getEmployeeByUserId(user.userId),
      request.json().catch(() => undefined),
    ]);
    if (!employee) return errorResponse('Profil karyawan tidak ditemukan', 404);

    const parsed = requestSchema.safeParse(rawBody);
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Payload tukar shift tidak valid');

    const swap = await requestSwap({
      requesterId: employee.id,
      requesterDate: new Date(parsed.data.requesterDate),
      targetId: parsed.data.targetEmployeeId,
      targetDate: new Date(parsed.data.targetDate),
      reason: parsed.data.reason,
    });

    await logAudit(user.userId, 'REQUEST_SHIFT_SWAP', 'ShiftSwapRequest', swap.id, undefined, {
      targetId: swap.targetId,
    }, request);

    // Realtime: ping the target colleague + surface on admin dashboards.
    await notifyUser({
      employeeId: swap.targetId,
      title: 'Permintaan Tukar Shift',
      message: `${employee.fullName} ingin menukar shift dengan Anda. Menunggu persetujuan admin.`,
      type: 'SHIFT_SWAP_REQUESTED',
    });
    await publishRealtimeEvent(createRealtimeEvent({
      type: 'dashboard.updated', scope: 'role', target: 'SUPERADMIN',
      payload: { source: 'shift-swap.requested', swapId: swap.id },
    }));

    return successResponse(swap, 'Permintaan tukar shift terkirim', 201);
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
