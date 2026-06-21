import { NextRequest } from 'next/server';
import { z } from 'zod';
import { attendanceExceptionService } from '@/services/attendance/attendance-exception.service';
import { requireAuth, getRequestBody } from '@/lib/middleware';
import { hasPermission } from '@/lib/permissions';
import { successResponse, forbiddenResponse, unauthorizedResponse, validationErrorResponse, errorResponse } from '@/utils/response';
import { logAudit } from '@/lib/audit';
import { handleApiError } from '@/lib/core/route-handler';
import { BusinessError } from '@/lib/core/business-error';
import { rateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Capped so one request can't run unbounded and hit the gateway timeout. The
// client chunks large selections (e.g. 1000+) into successive calls.
const MAX_BATCH = 200;

const bulkReviewSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Pilih minimal satu pengajuan').max(MAX_BATCH, `Maksimal ${MAX_BATCH} per permintaan`),
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().min(5, 'Catatan review minimal 5 karakter'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (!hasPermission(user.role, 'ATTENDANCE_MANUAL_ADJUST')) {
      return forbiddenResponse('Anda tidak memiliki akses review exception absensi');
    }

    // Throttle the batch endpoint — each call can mutate up to 200 rows.
    const rl = await rateLimit(request, RATE_LIMITS.API_STRICT, 'attendance:bulk-review');
    if (rl.limited) {
      return errorResponse('Terlalu banyak permintaan proses massal. Coba lagi sebentar.', 429);
    }

    const body = await getRequestBody(request);
    const validation = bulkReviewSchema.safeParse(body);
    if (!validation.success) return validationErrorResponse(validation.error.errors[0].message);

    const { ids, status, reviewNote } = validation.data;

    let processed = 0;
    let skipped = 0; // already reviewed / not found
    let failed = 0;

    for (const id of ids) {
      try {
        await attendanceExceptionService.reviewException({
          id,
          reviewerUserId: user.userId,
          status,
          reviewNote,
        });
        processed++;
      } catch (error) {
        // Already-processed or missing rows are expected in a large batch —
        // count them separately rather than failing the whole request.
        if (error instanceof BusinessError) skipped++;
        else failed++;
      }
    }

    await logAudit(
      user.userId,
      `BULK_${status}`,
      'AttendanceException',
      `${ids.length} items`,
      undefined,
      { requested: ids.length, processed, skipped, failed },
      request,
    );

    return successResponse(
      { processed, skipped, failed, requested: ids.length },
      `${processed} pengajuan diproses${skipped ? `, ${skipped} dilewati` : ''}${failed ? `, ${failed} gagal` : ''}`,
    );
  } catch (error: any) {
    if (error.message === 'Unauthorized') return unauthorizedResponse();
    return handleApiError(error);
  }
}
