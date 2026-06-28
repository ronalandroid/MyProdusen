import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/middleware';
import { assertPayrollAccess, payrollAccessErrorMessage } from '@/lib/payroll/access';
import { successResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse } from '@/utils/response';
import { handleApiError, withApiHandler } from '@/lib/core/route-handler';
import { logAudit } from '@/lib/audit';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';
import { notifyUser } from '@/lib/notifications/dispatch';
import { generateThr, listThr } from '@/src/services/payroll/thr.service';

const currentYear = new Date().getFullYear();

const generateSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  religiousHoliday: z.string().min(3, 'Nama hari raya minimal 3 karakter').max(120),
  holidayDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Tanggal hari raya tidak valid'),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'read');
    const year = Number(new URL(request.url).searchParams.get('year')) || currentYear;
    return successResponse(await listThr(year));
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
}

export const POST = withApiHandler(async (request) => {
  try {
    const user = await requireAuth(request);
    assertPayrollAccess(user.role, 'mutate');

    const parsed = generateSchema.safeParse(await request.json().catch(() => undefined));
    if (!parsed.success) return validationErrorResponse(parsed.error.errors[0]?.message || 'Payload THR tidak valid');

    const results = await generateThr({
      year: parsed.data.year,
      religiousHoliday: parsed.data.religiousHoliday,
      holidayDate: new Date(parsed.data.holidayDate),
      actorUserId: user.userId,
    });

    await logAudit(user.userId, 'GENERATE_THR', 'ThrPayment', `${parsed.data.year}`, undefined, {
      year: parsed.data.year,
      religiousHoliday: parsed.data.religiousHoliday,
      employees: results.length,
      total: results.reduce((sum, r) => sum + r.amount, 0),
    }, request);

    // Realtime: refresh dashboards now, and notify each recipient (notifyUser
    // emits a per-user notification.created realtime event of its own).
    await publishRealtimeEvent(createRealtimeEvent({
      type: 'dashboard.updated',
      scope: 'global',
      payload: { source: 'thr.generated', year: parsed.data.year, count: results.length },
    }));
    await Promise.all(results.map((r) => notifyUser({
      employeeId: r.employeeId,
      title: 'THR Dihitung',
      message: `THR ${parsed.data.religiousHoliday} Anda telah dihitung: Rp ${r.amount.toLocaleString('id-ID')}.`,
      type: 'THR_CALCULATED',
    })));

    return successResponse(
      { year: parsed.data.year, count: results.length, items: results },
      `THR ${parsed.data.religiousHoliday} berhasil dihitung untuk ${results.length} karyawan`,
      201,
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    const accessMessage = payrollAccessErrorMessage(error);
    if (accessMessage) return forbiddenResponse(accessMessage);
    return handleApiError(error);
  }
});
